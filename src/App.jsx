import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc, serverTimestamp } from 'firebase/firestore';

// --- Firebase Initialization ---
let app, auth, db;
const appId = 'prestige-threads-live';
let isFirebaseConfigured = false;

try {
  // Checks if a real Firebase config is provided, otherwise falls back to Demo/Local mode
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : null;
  if (firebaseConfig && firebaseConfig.apiKey) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseConfigured = true;
  }
} catch (e) {
  console.error("Firebase init error:", e);
}

// --- Icons (Inline SVGs) ---
const Icons = {
  Store: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>,
  Settings: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0-2.83l-.06-.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>,
  Upload: () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>,
  Wand: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 4V2"></path><path d="M15 16v-2"></path><path d="M8 9h2"></path><path d="M20 9h2"></path><path d="M17.8 11.8L19 13"></path><path d="M15 9h.01"></path><path d="M17.8 6.2L19 5"></path><path d="M3 21l9-9"></path><path d="M12.2 6.2L11 5"></path></svg>,
  Plus: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>,
  Trash: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>,
  Share: () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>,
  ChevronRight: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>,
  ChevronLeft: () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>,
  WhatsApp: () => <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z"/></svg>
};

const DEMO_ITEMS = [
  {
    id: 'demo-1',
    name: 'Saint Laurent Envelope Bag',
    category: 'Bags',
    material: 'Quilted Calfskin',
    description: 'Brand new with dustbag. Iconic YSL monogram, silver-tone hardware.',
    price: '750.00',
    rrp: '845.00',
    image: 'https://images.unsplash.com/photo-1584916201218-f4242ceb4809?auto=format&fit=crop&q=80&w=600&h=750',
    variants: [{size: 'OS', qty: 1}]
  },
  {
    id: 'demo-2',
    name: 'Canada Goose Chilliwack Bomber',
    category: 'Jackets & Coats',
    material: 'Arctic Tech®',
    description: 'Brand New. Burnt Orange, extreme weather protection.',
    price: '550.00',
    rrp: '1125.00',
    image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&q=80&w=600&h=750',
    variants: [{size: 'S', qty: 2}, {size: 'M', qty: 1}]
  },
  {
    id: 'demo-3',
    name: 'Amiri Pegasus T-Shirt',
    category: 'T-Shirts',
    material: '100% Premium Cotton',
    description: 'Brand New. Black with front graphic print.',
    price: '220.00',
    rrp: '420.00',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=600&h=750',
    variants: [{size: 'M', qty: 3}, {size: 'L', qty: 1}]
  },
  {
    id: 'demo-4',
    name: 'Balenciaga Track Sneakers',
    category: 'Footwear',
    material: 'Mesh & Nylon',
    description: 'Excellent condition. Dynamic sole design.',
    price: '450.00',
    rrp: '825.00',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=600&h=750',
    variants: [{size: 'UK 8', qty: 1}, {size: 'UK 9', qty: 1}]
  },
  {
    id: 'demo-5',
    name: 'Gucci GG Washed Denim',
    category: 'Jeans & Trousers',
    material: 'Cotton Denim',
    description: 'Brand New. Vintage wash with marmont hardware.',
    price: '400.00',
    rrp: '650.00',
    image: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&q=80&w=600&h=750',
    variants: [{size: '30', qty: 2}, {size: '32', qty: 1}]
  },
  {
    id: 'demo-6',
    name: 'Tom Ford Leather Belt',
    category: 'Belts',
    material: 'Full Grain Leather',
    description: 'Brand New with tags. T logo buckle in gold-tone.',
    price: '250.00',
    rrp: '450.00',
    image: 'https://images.unsplash.com/photo-1627042633145-b780d842ba45?auto=format&fit=crop&q=80&w=600&h=750',
    variants: [{size: 'OS', qty: 3}]
  }
];

export default function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState('catalog');
  const [isAdminAuth, setIsAdminAuth] = useState(false);
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem('pt_local_items');
    return saved ? JSON.parse(saved) : [];
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return;
    }
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (err) {
        console.error("Auth failed:", err);
        setLoading(false);
      }
    };
    initAuth();
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isFirebaseConfigured || !user || !db) return;
    
    const catalogRef = collection(db, 'artifacts', appId, 'public', 'data', 'clothing_catalog');
    
    const unsubscribe = onSnapshot(catalogRef, (snapshot) => {
      const fetchedItems = [];
      snapshot.forEach(doc => {
        fetchedItems.push({ id: doc.id, ...doc.data() });
      });
      
      fetchedItems.sort((a, b) => {
        const timeA = a.createdAt ? a.createdAt.toMillis() : Date.now();
        const timeB = b.createdAt ? b.createdAt.toMillis() : Date.now();
        return timeB - timeA;
      });
      
      setItems(fetchedItems);
      setLoading(false);
    }, (error) => {
      console.error("Firestore error:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateLocalItems = (newItems) => {
    setItems(newItems);
    localStorage.setItem('pt_local_items', JSON.stringify(newItems));
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-black font-sans flex flex-col selection:bg-black selection:text-white">
      <header className="bg-white border-b border-black/10 sticky top-0 z-30 transition-all">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center justify-center cursor-default">
                <span className="text-[9px] tracking-[0.3em] font-medium text-gray-400 uppercase leading-none mb-1">Prestige Threads</span>
                <div className="text-3xl font-serif tracking-widest leading-none">P.T</div>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm font-medium tracking-wide uppercase">
            <button 
              onClick={() => setView('catalog')}
              className={`pb-1 border-b-2 transition-all duration-300 ${view === 'catalog' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
            >
              Catalog
            </button>
            <button 
              onClick={() => setView('admin')}
              className={`pb-1 border-b-2 transition-all duration-300 ${view === 'admin' ? 'border-black text-black' : 'border-transparent text-gray-400 hover:text-black'}`}
            >
              Admin
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          view === 'catalog' ? (
            <CatalogView items={items} />
          ) : isAdminAuth ? (
            <AdminView items={items} user={user} updateLocalItems={updateLocalItems} />
          ) : (
            <AdminPinLogin onLogin={() => setIsAdminAuth(true)} />
          )
        )}
      </main>
    </div>
  );
}

function AdminPinLogin({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const activePin = localStorage.getItem('pt_admin_pin') || '1234';
    if (pin === activePin) {
      onLogin();
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  return (
    <div className="flex justify-center items-center py-20">
      <form onSubmit={handleSubmit} className="bg-white p-10 max-w-sm w-full border border-black/10">
        <div className="flex justify-center mb-6 text-black">
          <Icons.Settings />
        </div>
        <h2 className="text-sm tracking-widest uppercase font-bold text-center text-black mb-8">Admin Authentication</h2>
        <div className="mb-6">
          <input 
            type="password" 
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            className="w-full px-4 py-3 border-b border-black/20 focus:border-black outline-none bg-transparent text-center text-xl tracking-[1em] transition-colors"
            placeholder="••••"
            autoFocus
          />
          {error && <p className="text-red-500 text-xs tracking-wide text-center mt-3 uppercase">{error}</p>}
        </div>
        <button type="submit" className="w-full bg-black hover:bg-neutral
