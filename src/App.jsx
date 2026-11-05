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
        <button type="submit" className="w-full bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest py-4 transition-colors">
          Unlock
        </button>
      </form>
    </div>
  );
}

function CatalogView({ items }) {
  const [activeCategory, setActiveCategory] = useState(null);

  const isDemoMode = items.length === 0;
  const displayItems = isDemoMode ? DEMO_ITEMS : items;

  const availableItems = displayItems.filter(item => {
    return (item.variants?.reduce((sum, v) => sum + (parseInt(v.qty) || 0), 0) || 0) > 0;
  });

  if (availableItems.length === 0 && activeCategory === null) {
    return (
      <div className="text-center py-32 border border-black/10 bg-white">
        <Icons.Store className="mx-auto h-8 w-8 text-black mb-4 opacity-50" />
        <h2 className="text-sm tracking-widest uppercase font-bold text-black">Inventory Empty</h2>
        <p className="text-gray-500 text-sm mt-2">Check back soon for new arrivals.</p>
      </div>
    );
  }

  const ALL_CATEGORIES = [
    "T-Shirts", "Jackets & Coats", "Jeans & Trousers", 
    "Footwear", "Bags", "Belts", "Accessories", "Other"
  ];

  if (activeCategory === null) {
    return (
      <div className="space-y-12 pb-20 w-full animate-in fade-in duration-700">
        {isDemoMode && (
          <div className="bg-black text-white px-6 py-4 flex items-center justify-center gap-3">
            <Icons.Wand /> 
            <span className="font-medium text-xs tracking-wide uppercase text-center">Previewing with demo data. Add an item in Admin to replace.</span>
          </div>
        )}

        <div className="relative bg-black text-white p-12 sm:p-24 flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?q=80&w=2000&auto=format&fit=crop')] opacity-20 bg-cover bg-center grayscale mix-blend-overlay"></div>
          <span className="text-[10px] tracking-[0.4em] text-gray-400 uppercase mb-6 relative z-10 font-medium">Curated For You</span>
          <h2 className="text-4xl sm:text-6xl font-serif tracking-widest mb-6 relative z-10">PRESTIGE THREADS</h2>
          <p className="text-gray-300 font-light tracking-widest max-w-lg relative z-10 text-sm uppercase">Exclusive pieces. Unmatched Quality.</p>
        </div>

        <div className="text-center">
          <h3 className="text-xs font-bold tracking-[0.2em] uppercase text-black mb-8 border-b border-black/10 pb-4 inline-block">Explore Categories</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-black/5 border border-black/5">
          {ALL_CATEGORIES.map(category => {
            const itemCount = availableItems.filter(item => (item.category || 'Other') === category).length;
            if (itemCount === 0) return null;

            return (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className="bg-white aspect-[4/3] flex flex-col items-center justify-center p-6 hover:bg-[#fafafa] transition-colors group relative"
              >
                <span className="text-lg font-serif tracking-widest text-black mb-2">{category}</span>
                <span className="text-[10px] tracking-widest uppercase text-gray-500 font-medium">{itemCount} items</span>
                
                <div className="absolute bottom-6 w-0 h-px bg-black group-hover:w-12 transition-all duration-500"></div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const displayedItems = availableItems.filter(item => (item.category || 'Other') === activeCategory);

  return (
    <div className="pb-20 animate-in fade-in duration-500 w-full">
      <div className="flex flex-col items-center mb-16 text-center">
        <button 
          onClick={() => setActiveCategory(null)}
          className="flex items-center gap-2 text-gray-400 hover:text-black text-xs font-bold uppercase tracking-widest transition-colors mb-6"
        >
          <Icons.ChevronLeft /> Back
        </button>
        <h2 className="text-4xl font-serif tracking-widest text-black mb-3">{activeCategory}</h2>
        <span className="text-xs font-medium text-gray-500 tracking-widest uppercase">
          {displayedItems.length} Pieces Available
        </span>
      </div>

      {displayedItems.length === 0 ? (
        <div className="text-center py-32 border border-black/10 bg-white">
          <h2 className="text-sm tracking-widest uppercase font-bold text-black">Sold Out</h2>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
          {displayedItems.map(item => (
            <CatalogCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function CatalogCard({ item }) {
  const totalStock = item.variants?.reduce((sum, v) => sum + (parseInt(v.qty) || 0), 0) || 0;
  const isOutOfStock = totalStock <= 0;

  return (
    <div className="group flex flex-col bg-transparent">
      <div className="relative aspect-[3/4] bg-[#f5f5f5] overflow-hidden mb-6">
        {item.image ? (
          <img src={item.image} alt={item.name} className={`w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105 ${isOutOfStock ? 'opacity-50 grayscale' : ''}`} loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300 font-medium text-xs tracking-widest uppercase">No Image</div>
        )}
        
        {isOutOfStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm z-10">
            <span className="bg-black text-white text-xs font-bold px-6 py-2 tracking-[0.2em] uppercase">
              Sold Out
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-base leading-snug text-black uppercase tracking-wide">{item.name || 'Unnamed Item'}</h3>
            <p className="text-xs text-gray-500 mt-1">{item.material || 'Premium Material'}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="font-medium text-sm text-black">£{item.price || '0.00'}</span>
            {item.rrp && (
              <span className="block text-[10px] text-gray-400 line-through mt-0.5">RRP £{item.rrp}</span>
            )}
          </div>
        </div>
        
        {item.description && <p className="text-xs text-gray-600 mb-6 line-clamp-2 leading-relaxed">{item.description}</p>}

        <div className="mt-auto pt-4 border-t border-black/10">
          <div className="flex flex-wrap gap-2 mb-6">
            {item.variants && item.variants.some(v => parseInt(v.qty) > 0) ? (
              item.variants.filter(v => parseInt(v.qty) > 0).map((v) => (
                <div 
                  key={v.size} 
                  className="relative group/size flex items-center justify-center border border-black/10 text-black min-w-[2.5rem] h-8 px-2 text-xs font-bold uppercase transition-all hover:border-black cursor-default bg-white"
                >
                  <span>{v.size}</span>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-white text-[9px] tracking-wider px-2 py-1 opacity-0 group-hover/size:opacity-100 pointer-events-none transition-opacity whitespace-nowrap">
                    {v.qty} left
                  </div>
                </div>
              ))
            ) : (
              <span className="text-xs text-gray-400 italic">Sold out</span>
            )}
          </div>
        </div>
        
        <a 
          href={`https://wa.me/?text=${encodeURIComponent(`Hi Prestige Threads, I'm interested in the ${item.name || 'item'} for £${item.price}. Which sizes are available?`)}`}
          target="_blank" 
          rel="noopener noreferrer" 
          className="w-full bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-[0.2em] py-4 transition-colors flex items-center justify-center gap-3"
        >
          <span className="text-white"><Icons.WhatsApp /></span> Purchase
        </a>
      </div>
    </div>
  );
}

function AdminView({ items, user, updateLocalItems }) {
  const [image, setImage] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeAdminCategory, setActiveAdminCategory] = useState('All');
  
  const [currentPin, setCurrentPin] = useState(localStorage.getItem('pt_admin_pin') || '1234');
  const [newPin, setNewPin] = useState('');
  const [pinMessage, setPinMessage] = useState('');
  
  const fileInputRef = useRef(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('T-Shirts');
  const [description, setDescription] = useState('');
  const [material, setMaterial] = useState('');
  const [price, setPrice] = useState('');
  const [rrp, setRrp] = useState('');
  
  const defaultSizes = [
    { size: 'XS', qty: 0 },
    { size: 'S', qty: 0 },
    { size: 'M', qty: 0 },
    { size: 'L', qty: 0 },
    { size: 'XL', qty: 0 }
  ];
  const [variants, setVariants] = useState(defaultSizes);

  const handleUpdatePin = (e) => {
    e.preventDefault();
    if (!newPin || newPin.length < 4) {
      setPinMessage('PIN must be at least 4 characters');
      return;
    }
    localStorage.setItem('pt_admin_pin', newPin);
    setCurrentPin(newPin);
    setNewPin('');
    setPinMessage('PIN updated successfully!');
    setTimeout(() => setPinMessage(''), 3000);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 600;
        let width = img.width;
        let height = img.height;

        if (width > height && width > MAX_DIM) {
          height *= MAX_DIM / width;
          width = MAX_DIM;
        } else if (height > MAX_DIM) {
          width *= MAX_DIM / height;
          height = MAX_DIM;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setImage(compressedBase64);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const runAIAnalysis = async () => {
    if (!image) return;
    setIsAnalyzing(true);
    
    try {
      const base64Data = image.split(',')[1];
      const apiKey = "";
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{
          role: "user",
          parts: [
            { text: "Identify this exact designer clothing item or accessory using Google Search. Find its specific brand and product model name. Return a JSON object with: 'name' (exact brand and model), 'material' (main material), 'description' (short 1 sentence description, note if it looks brand new), 'rrp' (estimated Recommended Retail Price in GBP, numbers only), and 'category' (choose EXACTLY ONE from: T-Shirts, Jackets & Coats, Jeans & Trousers, Footwear, Bags, Belts, Accessories, Other)." },
            { inlineData: { mimeType: "image/jpeg", data: base64Data } }
          ]
        }],
        tools: [{ "google_search": {} }],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              name: { type: "STRING" },
              material: { type: "STRING" },
              description: { type: "STRING" },
              rrp: { type: "STRING" },
              category: { type: "STRING" }
            }
          }
        }
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
        const resultJSON = JSON.parse(data.candidates[0].content.parts[0].text);
        if (resultJSON.name) setName(resultJSON.name);
        if (resultJSON.material) setMaterial(resultJSON.material);
        if (resultJSON.description) setDescription(resultJSON.description);
        if (resultJSON.rrp) setRrp(resultJSON.rrp);
        if (resultJSON.category) setCategory(resultJSON.category);
      }
    } catch (error) {
      console.error("AI Analysis failed:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateVariant = (size, value) => {
    setVariants(variants.map(v => v.size === size ? { ...v, qty: value } : v));
  };

  const handleSave = async () => {
    if (!image || !name || !price) return;

    setIsSaving(true);
    try {
      if (isFirebaseConfigured && user && db) {
        const catalogRef = collection(db, 'artifacts', appId, 'public', 'data', 'clothing_catalog');
        await addDoc(catalogRef, {
          image, name, category, description, material, price, rrp, variants,
          createdAt: serverTimestamp()
        });
      } else {
        const newItem = {
          id: 'local-' + Date.now(),
          image, name, category, description, material, price, rrp, variants
        };
        updateLocalItems([newItem, ...items]);
      }

      setImage(null);
      setName('');
      setCategory('T-Shirts');
      setDescription('');
      setMaterial('');
      setPrice('');
      setRrp('');
      setVariants(defaultSizes);
      if(fileInputRef.current) fileInputRef.current.value = '';

    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (itemId) => {
    try {
      if (isFirebaseConfigured && user && db) {
        await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clothing_catalog', itemId));
      } else {
        updateLocalItems(items.filter(i => i.id !== itemId));
      }
    } catch (error) {
      console.error("Delete failed:", error);
    }
  };

  const handleUpdateStock = async (itemId, currentVariants, sizeToUpdate, delta) => {
    try {
      const newVariants = currentVariants.map(v => {
        if (v.size === sizeToUpdate) {
          return { ...v, qty: Math.max(0, parseInt(v.qty) + delta) };
        }
        return v;
      });
      if (isFirebaseConfigured && user && db) {
        await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'clothing_catalog', itemId), {
          variants: newVariants
        });
      } else {
        updateLocalItems(items.map(i => i.id === itemId ? { ...i, variants: newVariants } : i));
      }
    } catch (error) {
      console.error("Update stock failed:", error);
    }
  };

  const ADMIN_CATEGORIES = [
    "All", "T-Shirts", "Jackets & Coats", "Jeans & Trousers", 
    "Footwear", "Bags", "Belts", "Accessories", "Other"
  ];

  const filteredAdminItems = items.filter(item => activeAdminCategory === 'All' || (item.category || 'Other') === activeAdminCategory);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white p-6 border border-black/10">
          <h3 className="text-xs font-bold tracking-widest uppercase text-black mb-4 flex items-center justify-between">
            <span>Security PIN</span>
            <span className="text-[10px] text-gray-400 font-normal">Default: 1234</span>
          </h3>
          <form onSubmit={handleUpdatePin} className="flex gap-2">
            <input 
              type="password" 
              value={newPin} 
              onChange={e => setNewPin(e.target.value)} 
              placeholder="New PIN" 
              className="w-full px-3 py-2 border border-black/20 text-xs outline-none focus:border-black bg-transparent"
            />
            <button type="submit" className="bg-black text-white text-xs font-bold uppercase px-4 tracking-wider hover:bg-neutral-800 transition-colors shrink-0">
              Update
            </button>
          </form>
          {pinMessage && <p className="text-[10px] font-bold tracking-widest uppercase mt-2 text-center text-green-600">{pinMessage}</p>}
        </div>

        <div className="bg-white p-8 border border-black/10">
          <h2 className="text-sm font-bold tracking-widest uppercase text-black mb-6 flex items-center gap-2 border-b border-black/10 pb-4">
            <Icons.Plus /> Add Piece
          </h2>
          
          <div className="mb-6">
            <div 
              onClick={() => !image && fileInputRef.current?.click()}
              className={`relative flex flex-col items-center justify-center w-full h-32 border transition-all ${!image ? 'border-black/20 hover:border-black bg-[#fafafa] cursor-pointer border-dashed' : 'border-black/10 bg-white'}`}
            >
              {image ? (
                <>
                  <img src={image} alt="Preview" className="w-full h-full object-contain p-2" />
                  <button 
                    onClick={() => setImage(null)} 
                    className="absolute top-2 right-2 bg-black text-white p-2 hover:bg-red-600 transition-colors"
                  >
                    <Icons.Trash />
                  </button>
                </>
              ) : (
                <div className="flex flex-col items-center text-gray-400">
                  <Icons.Upload />
                  <span className="mt-2 text-[10px] tracking-widest uppercase font-bold">Tap to upload</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
            </div>
          </div>

          <button 
            onClick={runAIAnalysis}
            disabled={!image || isAnalyzing}
            className="w-full mb-8 bg-black hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-widest py-3 flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
               <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
               <Icons.Wand />
            )}
            {isAnalyzing ? "Analyzing with Google..." : "Auto-Fill details"}
          </button>

          <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Item Name</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-0 py-2 border-b border-black/20 focus:border-black outline-none transition-colors bg-transparent text-sm" placeholder="e.g. Amiri Pegasus T-Shirt" />
            </div>

            <div>
              <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Description</label>
              <textarea value={description} onChange={e => setDescription(e.target.value)} rows="2" className="w-full px-0 py-2 border-b border-black/20 focus:border-black outline-none transition-colors bg-transparent text-sm resize-none" placeholder="Details..."></textarea>
            </div>
            
            <div className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Category</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-0 py-2 border-b border-black/20 focus:border-black outline-none transition-colors bg-transparent text-sm">
                  <option value="T-Shirts">T-Shirts</option>
                  <option value="Jackets & Coats">Jackets & Coats</option>
                  <option value="Jeans & Trousers">Jeans & Trousers</option>
                  <option value="Footwear">Footwear</option>
                  <option value="Bags">Bags</option>
                  <option value="Belts">Belts</option>
                  <option value="Accessories">Accessories</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Material</label>
                <input type="text" value={material} onChange={e => setMaterial(e.target.value)} className="w-full px-0 py-2 border-b border-black/20 focus:border-black outline-none transition-colors bg-transparent text-sm" placeholder="e.g. 100% Cotton" />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">RRP (£)</label>
                <input type="number" step="0.01" value={rrp} onChange={e => setRrp(e.target.value)} className="w-full px-0 py-2 border-b border-black/20 focus:border-black outline-none transition-colors bg-transparent text-sm" placeholder="0.00" />
              </div>
              <div>
                <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-2">Our Price (£)</label>
                <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="w-full px-0 py-2 border-b border-black/20 focus:border-black outline-none transition-colors bg-transparent text-sm font-bold" placeholder="0.00" />
              </div>
            </div>

            <div className="pt-4">
              <label className="block text-[10px] font-bold tracking-widest uppercase text-gray-500 mb-3">Inventory Quantities</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {variants.map((v) => (
                  <div key={v.size} className="flex items-center border border-black/10 px-3 py-1 bg-[#fafafa]">
                    <span className="w-8 font-bold text-xs uppercase">{v.size}</span>
                    <input 
                      type="number" 
                      min="0"
                      value={v.qty} 
                      onChange={e => updateVariant(v.size, parseInt(e.target.value) || 0)} 
                      className="w-full px-2 py-1 bg-transparent text-sm outline-none text-right font-medium" 
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={handleSave}
            disabled={isSaving || !image || !name || !price}
            className="mt-10 w-full border-2 border-black bg-white hover:bg-black text-black hover:text-white text-xs font-bold uppercase tracking-widest py-3 transition-colors disabled:opacity-30 disabled:hover:bg-white disabled:hover:text-black flex justify-center items-center gap-2"
          >
            {isSaving ? "Publishing..." : "Publish to Store"}
          </button>
        </div>
      </div>

      <div className="lg:col-span-3">
        <div className="bg-white p-8 border border-black/10 min-h-full">
          <div className="flex flex-col gap-4 mb-8 border-b border-black/10 pb-6">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-bold tracking-widest uppercase text-black">
                  Inventory Ledger
              </h2>
              <span className="text-[10px] font-medium text-gray-400 tracking-wider">({filteredAdminItems.length} shown)</span>
            </div>
            
            <div className="flex flex-wrap gap-2 pt-2">
              {ADMIN_CATEGORIES.map(cat => {
                const count = cat === 'All' ? items.length : items.filter(i => (i.category || 'Other') === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setActiveAdminCategory(cat)}
                    className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 border transition-all ${activeAdminCategory === cat ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-black/10 hover:border-black'}`}
                  >
                    {cat} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {filteredAdminItems.length === 0 ? (
            <div className="text-center py-20 text-gray-400 text-xs tracking-widest uppercase font-medium">
              No items found in this section.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAdminItems.map(item => (
                <div key={item.id} className="flex gap-5 p-4 border border-black/10 hover:border-black/30 transition-colors group bg-white">
                  <div className="w-16 h-20 shrink-0 bg-[#fafafa]">
                    {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover mix-blend-multiply" />}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-sm text-black truncate uppercase tracking-wide">{item.name}</h4>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 border border-gray-200 px-1.5 py-0.5">{item.category || 'Other'}</span>
                    </div>
                    <p className="text-xs text-black font-medium mt-1">£{item.price} {item.rrp && <span className="text-gray-400 line-through ml-2">£{item.rrp}</span>}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.variants?.map(v => (
                        <div key={v.size} className="flex items-center text-[10px] uppercase font-bold border border-black/10 bg-white">
                          <span className="px-2 py-1 text-gray-500 border-r border-black/10">{v.size}</span>
                          <button 
                            onClick={() => handleUpdateStock(item.id, item.variants, v.size, -1)} 
                            disabled={v.qty <= 0}
                            className="px-2 py-1 hover:bg-black hover:text-white disabled:opacity-20 disabled:hover:bg-white disabled:hover:text-black transition-colors"
                          >-</button>
                          <span className={`px-2 py-1 min-w-[20px] text-center ${v.qty > 0 ? 'text-black' : 'text-red-500'}`}>
                            {v.qty}
                          </span>
                          <button 
                            onClick={() => handleUpdateStock(item.id, item.variants, v.size, 1)} 
                            className="px-2 py-1 hover:bg-black hover:text-white transition-colors"
                          >+</button>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <a 
                      href={`https://wa.me/?text=${encodeURIComponent(`Brand New\n${item.name}\n\n${item.description || item.material}\n\n${item.rrp ? `RRP £${item.rrp}\n` : ''}Our price £${item.price}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 text-black hover:bg-neutral-100 transition-colors border border-black/10"
                      title="Share to WhatsApp Group"
                    >
                      <Icons.Share />
                    </a>
                    
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-3 text-gray-300 hover:text-red-600 transition-colors"
                      title="Remove from catalog"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
