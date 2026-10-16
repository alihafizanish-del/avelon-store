const API_URL = 'http://localhost:5000/api/store';

let storeData = {
  products: [],
  catalogs: [],
  orders: [],
  couriers: [],
  settings: {}
};

let state = {
  cart: JSON.parse(localStorage.getItem('avelon_cart')) || [],
  shopView: 'collections',
  selectedCollection: null,
  selectedCatalog: null
};

let activeImageIndices = {};

window.addEventListener('DOMContentLoaded', async () => {
  await fetchStoreData();
  initCursorGlow();
  initHeroSpotlight();
  renderShopHierarchy();
  updateCartUI();
  applySettingsToUI();
  renderFloatingPaymentShortcuts();
  document.getElementById('year-span').innerText = new Date().getFullYear();
});

async function fetchStoreData() {
  try {
    const res = await fetch(API_URL);
    const data = await res.json();
    storeData = data;
  } catch (err) {
    console.error('Failed to load store data from backend:', err);
  }
}

async function syncStoreData() {
  try {
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(storeData)
    });
  } catch (err) {
    console.error('Failed to sync data with backend:', err);
  }
}

function initCursorGlow() {
  const dot = document.getElementById('cursor-dot');
  const ring = document.getElementById('cursor-ring');
  if (!dot || !ring) return;
  let mouseX = 0, mouseY = 0;
  let ringX = 0, ringY = 0;
  window.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
    dot.style.transform = `translate(${mouseX - 4}px, ${mouseY - 4}px)`;
  });
  function renderCursor() {
    ringX += (mouseX - ringX) * 0.2;
    ringY += (mouseY - ringY) * 0.2;
    ring.style.transform = `translate(${ringX - 18}px, ${ringY - 18}px)`;
    requestAnimationFrame(renderCursor);
  }
  requestAnimationFrame(renderCursor);
}

function initHeroSpotlight() {
  const hero = document.getElementById('home');
  const overlay = document.getElementById('hero-overlay');
  if (!hero || !overlay) return;
  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / hero.offsetWidth) * 100;
    const y = ((e.clientY - rect.top) / hero.offsetHeight) * 100;
    overlay.style.setProperty('--mouse-x', `${x}%`);
    overlay.style.setProperty('--mouse-y', `${y}%`);
  });
}

function toggleMobileMenu() {
  const menu = document.getElementById('mobile-menu');
  if (menu) menu.classList.toggle('hidden');
}

function showToast(msg) {
  const toast = document.getElementById('toast');
  const msgEl = document.getElementById('toast-msg');
  if (!toast || !msgEl) return;
  msgEl.innerText = msg;
  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}

function getProductImages(p) {
  if (p.images && Array.isArray(p.images) && p.images.length > 0) return p.images;
  if (p.image) return [p.image];
  return ['https://placehold.co/600x750/0a0a0a/d4af37?text=AVELON'];
}

function changeProductImage(prodId, direction, event) {
  if (event) event.stopPropagation();
  const p = storeData.products.find(item => item.id === prodId);
  if (!p) return;
  const imgs = getProductImages(p);
  if (imgs.length <= 1) return;
  if (activeImageIndices[prodId] === undefined) activeImageIndices[prodId] = 0;
  activeImageIndices[prodId] = (activeImageIndices[prodId] + direction + imgs.length) % imgs.length;
  const idx = activeImageIndices[prodId];
  
  const imgEl = document.getElementById(`prod-img-${prodId}`);
  const idxEl = document.getElementById(`img-idx-${prodId}`);
  const modalImgEl = document.getElementById(`modal-img-${prodId}`);
  const modalIdxEl = document.getElementById(`modal-img-idx-${prodId}`);

  if (imgEl) imgEl.src = imgs[idx];
  if (idxEl) idxEl.innerText = idx + 1;
  if (modalImgEl) modalImgEl.src = imgs[idx];
  if (modalIdxEl) modalIdxEl.innerText = idx + 1;
}

function renderShopHierarchy() {
  const titleEl = document.getElementById('shop-section-title');
  const breadcrumbEl = document.getElementById('shop-breadcrumb-container');
  const container = document.getElementById('shop-content-container');
  if (!container || !titleEl || !breadcrumbEl) return;

  if (state.shopView === 'collections') {
    titleEl.innerText = 'Collections';
    breadcrumbEl.innerHTML = '<span class="text-gold-400">Select Collection</span>';
    const collectionsMap = {
      'Suits & Blazers': { img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?q=80&w=800&auto=format&fit=crop', desc: 'Bespoke Italian tuxedos and cashmere overcoats.' },
      'Watches': { img: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?q=80&w=800&auto=format&fit=crop', desc: 'Mechanical automatic timepieces and luxury chronographs.' },
      'Leather Goods': { img: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=800&auto=format&fit=crop', desc: 'Full-grain Tuscan leather briefcases and wallets.' },
      'Footwear': { img: 'https://images.unsplash.com/photo-1614252235316-8c857d38b5f4?q=80&w=800&auto=format&fit=crop', desc: 'Hand-patinated oxford dress shoes and loafers.' }
    };
    container.innerHTML = Object.keys(collectionsMap).map(colName => {
      const info = collectionsMap[colName];
      const catalogCount = storeData.catalogs.filter(c => c.collection === colName).length;
      return `
        <div class="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group cursor-pointer" onclick="selectCollection('${colName}')">
          <div class="relative overflow-hidden aspect-[4/5] bg-onyx">
            <img src="${info.img}" alt="${colName}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <span class="absolute top-3 left-3 bg-onyx/80 backdrop-blur-md text-gold-400 text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-gold-500/30">${catalogCount} Catalogs</span>
          </div>
          <div class="p-6 space-y-3">
            <h3 class="font-serif text-xl font-bold text-white group-hover:text-gold-400 transition-colors">${colName}</h3>
            <p class="text-xs text-gray-400">${info.desc}</p>
            <div class="pt-3 border-t border-gold-500/15 flex items-center justify-between text-xs font-bold text-gold-400">
              <span>Explore Collection</span>
              <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </div>
          </div>
        </div>`;
    }).join('');
  } else if (state.shopView === 'catalogs') {
    titleEl.innerText = state.selectedCollection;
    breadcrumbEl.innerHTML = `
      <button onclick="goToShopView('collections')" class="hover:text-gold-400 transition-colors">Collections</button>
      <span>/</span>
      <span class="text-gold-400 font-semibold">${state.selectedCollection}</span>`;
    const matchingCatalogs = storeData.catalogs.filter(c => c.collection === state.selectedCollection);
    if (matchingCatalogs.length === 0) {
      container.innerHTML = '<div class="col-span-full py-12 text-center text-gray-400 text-xs">No sub-catalogs found for this collection.</div>';
      return;
    }
    container.innerHTML = matchingCatalogs.map(cat => {
      const sampleProd = storeData.products.find(p => p.catalog === cat.name) || storeData.products.find(p => p.category === state.selectedCollection);
      const sampleImgs = sampleProd ? getProductImages(sampleProd) : ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop'];
      const prodCount = storeData.products.filter(p => p.catalog === cat.name || (!p.catalog && p.category === state.selectedCollection)).length;
      return `
        <div class="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group cursor-pointer" onclick="selectCatalog('${cat.name}')">
          <div class="relative overflow-hidden aspect-[4/5] bg-onyx">
            <img src="${sampleImgs[0]}" alt="${cat.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            <span class="absolute top-3 left-3 bg-onyx/80 backdrop-blur-md text-gold-400 text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-gold-500/30">${prodCount} Masterpieces</span>
          </div>
          <div class="p-6 space-y-3">
            <h3 class="font-serif text-lg font-bold text-white group-hover:text-gold-400 transition-colors">${cat.name}</h3>
            <div class="pt-3 border-t border-gold-500/15 flex items-center justify-between text-xs font-bold text-gold-400">
              <span>View Catalog</span>
              <i class="fa-solid fa-arrow-right group-hover:translate-x-1 transition-transform"></i>
            </div>
          </div>
        </div>`;
    }).join('');
  } else if (state.shopView === 'products') {
    titleEl.innerText = state.selectedCatalog;
    breadcrumbEl.innerHTML = `
      <button onclick="goToShopView('collections')" class="hover:text-gold-400 transition-colors">Collections</button>
      <span>/</span>
      <button onclick="selectCollection('${state.selectedCollection}')" class="hover:text-gold-400 transition-colors">${state.selectedCollection}</button>
      <span>/</span>
      <span class="text-gold-400 font-semibold">${state.selectedCatalog}</span>`;
    const matchingProducts = storeData.products.filter(p => p.catalog === state.selectedCatalog || (!p.catalog && p.category === state.selectedCollection));
    if (matchingProducts.length === 0) {
      container.innerHTML = '<div class="col-span-full py-12 text-center text-gray-400 text-xs">No masterpieces available in this catalog yet.</div>';
      return;
    }
    container.innerHTML = matchingProducts.map(p => {
      const imgs = getProductImages(p);
      const hasMultiple = imgs.length > 1;
      const currentIdx = activeImageIndices[p.id] || 0;
      const currentImg = imgs[currentIdx];
      return `
        <div class="glass-card rounded-2xl overflow-hidden flex flex-col justify-between group">
          <div class="relative overflow-hidden aspect-[4/5] bg-onyx cursor-pointer group/img" onclick="openProductModal('${p.id}')">
            <img id="prod-img-${p.id}" src="${currentImg}" alt="${p.name}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
            ${hasMultiple ? `
              <button onclick="changeProductImage('${p.id}', -1, event)" class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-gold-400 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black">
                <i class="fa-solid fa-chevron-left text-xs"></i>
              </button>
              <button onclick="changeProductImage('${p.id}', 1, event)" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 text-gold-400 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity hover:bg-black">
                <i class="fa-solid fa-chevron-right text-xs"></i>
              </button>
              <div class="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 px-2 py-0.5 rounded text-[10px] text-gold-400 font-mono">
                <span id="img-idx-${p.id}">${currentIdx + 1}</span>/${imgs.length}
              </div>` : ''}
            <span class="absolute top-3 left-3 bg-onyx/80 backdrop-blur-md text-gold-400 text-[10px] font-semibold px-2.5 py-1 rounded-lg border border-gold-500/30">${p.category}</span>
          </div>
          <div class="p-5 space-y-3 flex-1 flex flex-col justify-between">
            <div>
              <h3 class="font-serif text-base font-bold text-white group-hover:text-gold-400 transition-colors cursor-pointer" onclick="openProductModal('${p.id}')">${p.name}</h3>
              <p class="text-xs text-gray-400 mt-1 line-clamp-2">${p.description}</p>
            </div>
            <div class="flex items-center justify-between pt-2 border-t border-gold-500/15">
              <span class="font-serif font-bold text-gold-400 text-sm">Rs. ${p.price.toLocaleString()}</span>
              <button onclick="openProductModal('${p.id}')" class="px-3.5 py-2 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-bold text-xs uppercase tracking-wider shadow-md transition-all">
                View Details
              </button>
            </div>
          </div>
        </div>`;
    }).join('');
  }
}

function selectCollection(colName) {
  state.selectedCollection = colName;
  state.shopView = 'catalogs';
  renderShopHierarchy();
}

function selectCatalog(catName) {
  state.selectedCatalog = catName;
  state.shopView = 'products';
  renderShopHierarchy();
}

function goToShopView(view) {
  state.shopView = view;
  if (view === 'collections') {
    state.selectedCollection = null;
    state.selectedCatalog = null;
  } else if (view === 'catalogs') {
    state.selectedCatalog = null;
  }
  renderShopHierarchy();
}

function openProductModal(id) {
  const p = storeData.products.find(item => item.id === id);
  if (!p) return;
  const modal = document.getElementById('product-modal');
  const content = document.getElementById('product-modal-content');
  if (!modal || !content) return;
  const imgs = getProductImages(p);
  const hasMultiple = imgs.length > 1;
  const currentIdx = activeImageIndices[p.id] || 0;
  const currentImg = imgs[currentIdx];

  content.innerHTML = `
    <div class="aspect-[4/5] bg-onyx relative group/modalimg">
      <img id="modal-img-${p.id}" src="${currentImg}" alt="${p.name}" class="w-full h-full object-cover">
      ${hasMultiple ? `
        <button onclick="changeProductImage('${p.id}', -1, event)" class="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-gold-400 flex items-center justify-center hover:bg-black transition-all">
          <i class="fa-solid fa-chevron-left text-sm"></i>
        </button>
        <button onclick="changeProductImage('${p.id}', 1, event)" class="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-black/60 text-gold-400 flex items-center justify-center hover:bg-black transition-all">
          <i class="fa-solid fa-chevron-right text-sm"></i>
        </button>
        <div class="absolute bottom-3 left-1/2 -translate-x-1/2 bg-black/70 px-3 py-1 rounded-full text-xs text-gold-400 font-mono">
          <span id="modal-img-idx-${p.id}">${currentIdx + 1}</span>/${imgs.length}
        </div>` : ''}
    </div>
    <div class="p-8 flex flex-col justify-between space-y-6">
      <div class="space-y-3">
        <span class="text-xs uppercase tracking-widest text-gold-400 font-semibold">${p.category} / ${p.catalog || 'General'}</span>
        <h2 class="font-serif text-2xl font-bold text-white">${p.name}</h2>
        <p class="font-serif text-xl font-bold text-gold-400">Rs. ${p.price.toLocaleString()}</p>
        <p class="text-gray-300 text-xs leading-relaxed">${p.description}</p>
      </div>
      <div class="space-y-3 pt-4 border-t border-gold-500/20">
        <button onclick="addToCart('${p.id}'); closeProductModal();" class="w-full py-3.5 rounded-xl bg-gold-500 hover:bg-gold-400 text-black font-bold text-xs uppercase tracking-widest shadow-lg transition-all">
          Add to Shopping Bag
        </button>
      </div>
    </div>`;
  modal.classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.add('hidden');
}

function addToCart(id) {
  const p = storeData.products.find(item => item.id === id);
  if (!p) return;
  const existing = state.cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    const imgs = getProductImages(p);
    state.cart.push({...p, image: imgs[0], qty: 1});
  }
  localStorage.setItem('avelon_cart', JSON.stringify(state.cart));
  updateCartUI();
  showToast(`${p.name} added to bag.`);
}

function updateCartUI() {
  const badge = document.getElementById('cart-badge');
  const container = document.getElementById('cart-items-container');
  const subtotalEl = document.getElementById('cart-subtotal');
  if (!badge || !container || !subtotalEl) return;
  const totalCount = state.cart.reduce((sum, item) => sum + item.qty, 0);
  badge.innerText = totalCount;
  if (state.cart.length === 0) {
    container.innerHTML = '<div class="text-center py-12 text-gray-400 text-xs">Your shopping bag is currently empty.</div>';
    subtotalEl.innerText = 'Rs. 0';
    return;
  }
  let subtotal = 0;
  container.innerHTML = state.cart.map((item, idx) => {
    subtotal += item.price * item.qty;
    return `
      <div class="glass-card p-3.5 rounded-xl flex items-center justify-between gap-3 border border-gold-500/20">
        <img src="${item.image}" alt="${item.name}" class="w-14 h-14 object-cover rounded-lg">
        <div class="flex-1 min-w-0">
          <h4 class="font-serif text-xs font-bold text-white truncate">${item.name}</h4>
          <p class="text-[11px] text-gold-400 font-semibold mt-0.5">Rs. ${item.price.toLocaleString()} x ${item.qty}</p>
        </div>
        <div class="flex items-center gap-2">
          <button onclick="updateCartQty(${idx}, 1)" class="w-7 h-7 rounded-lg glass-card text-gold-400 font-bold text-xs flex items-center justify-center">+</button>
          <button onclick="updateCartQty(${idx}, -1)" class="w-7 h-7 rounded-lg glass-card text-gray-400 font-bold text-xs flex items-center justify-center">-</button>
        </div>
      </div>`;
  }).join('');
  subtotalEl.innerText = `Rs. ${subtotal.toLocaleString()}`;
}

function updateCartQty(idx, change) {
  state.cart[idx].qty += change;
  if (state.cart[idx].qty <= 0) {
    state.cart.splice(idx, 1);
  }
  localStorage.setItem('avelon_cart', JSON.stringify(state.cart));
  updateCartUI();
}

function openCartModal() {
  document.getElementById('cart-modal').classList.remove('hidden');
}

function closeCartModal() {
  document.getElementById('cart-modal').classList.add('hidden');
}

function openCheckoutModal() {
  if (state.cart.length === 0) {
    showToast('Your bag is empty.');
    return;
  }
  closeCartModal();
  const sel = document.getElementById('chk-courier');
  sel.innerHTML = storeData.couriers.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
  document.getElementById('checkout-modal').classList.remove('hidden');
}

function closeCheckoutModal() {
  document.getElementById('checkout-modal').classList.add('hidden');
}

async function handleCheckoutSubmit(e) {
  e.preventDefault();
  const name = document.getElementById('chk-name').value.trim();
  const phone = document.getElementById('chk-phone').value.trim();
  const address = document.getElementById('chk-address').value.trim();
  const courier = document.getElementById('chk-courier').value;
  const payment = document.getElementById('chk-payment').value;
  const orderId = 'AVL-' + Math.floor(10000 + Math.random() * 90000);
  const subtotal = state.cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const newOrder = {
    orderId,
    name,
    phone,
    address,
    courier,
    payment,
    items: [...state.cart],
    total: subtotal,
    status: 'Processing',
    trackingNumber: 'TRK-' + Math.floor(10000000 + Math.random() * 90000000),
    date: new Date().toLocaleDateString()
  };
  storeData.orders.unshift(newOrder);
  await syncStoreData();
  state.cart = [];
  localStorage.setItem('avelon_cart', JSON.stringify(state.cart));
  updateCartUI();
  closeCheckoutModal();
  showToast(`Order placed successfully! ID: ${orderId}`);
  document.getElementById('public-tracking-input').value = orderId;
  handlePublicOrderTrack();
}

function handlePublicOrderTrack() {
  const query = document.getElementById('public-tracking-input').value.trim();
  const box = document.getElementById('tracking-result-box');
  if (!query || !box) return;
  const order = storeData.orders.find(o => o.orderId.toLowerCase() === query.toLowerCase() || o.trackingNumber.toLowerCase() === query.toLowerCase());
  box.classList.remove('hidden');
  if (!order) {
    box.innerHTML = `
      <div class="glass-card p-4 rounded-xl border border-red-500/30 text-center text-red-400 text-xs">
        No active order found matching <span class="font-mono font-bold">${query}</span>. Please verify your ID.
      </div>`;
    return;
  }
  const courierObj = storeData.couriers.find(c => c.name === order.courier);
  const trackingUrl = courierObj ? courierObj.urlTemplate.replace('{tracking_no}', order.trackingNumber) : '#';
  box.innerHTML = `
    <div class="glass-card p-6 rounded-xl border border-gold-500/40 space-y-4">
      <div class="flex items-center justify-between border-b border-gold-500/20 pb-3">
        <div>
          <span class="text-[10px] text-gold-400 uppercase tracking-widest">Order #${order.orderId}</span>
          <h4 class="font-serif text-base font-bold text-white">${order.name}</h4>
        </div>
        <span class="px-3 py-1 rounded-full bg-gold-500/15 border border-gold-500/40 text-gold-400 text-xs font-semibold">${order.status}</span>
      </div>
      <div class="grid grid-cols-2 gap-4 text-xs">
        <div>
          <span class="text-gray-400 block">Courier Partner</span>
          <span class="text-white font-semibold">${order.courier}</span>
        </div>
        <div>
          <span class="text-gray-400 block">Tracking Number</span>
          <span class="text-gold-400 font-mono font-bold">${order.trackingNumber}</span>
        </div>
      </div>
      <div class="pt-2 flex items-center justify-between">
        <span class="text-xs text-gray-400">Total: <strong class="text-white">Rs. ${order.total.toLocaleString()}</strong></span>
        <a href="${trackingUrl}" target="_blank" rel="noopener noreferrer" class="px-4 py-2 bg-gold-500 hover:bg-gold-400 text-black font-bold text-xs rounded-xl shadow-md transition-all inline-flex items-center gap-1.5">
          <i class="fa-solid fa-external-link-alt text-[10px]"></i> Track on ${order.courier} Portal
        </a>
      </div>
    </div>`;
}

function renderFloatingPaymentShortcuts() {
  const container = document.getElementById('floating-shortcuts-container');
  if (!container) return;
  const set = storeData.settings;
  let html = '';
  const epEnabled = !set.easypaisa || set.easypaisa.enabled !== false;
  if (epEnabled) {
    const epLink = (set.easypaisa && set.easypaisa.appLink) || 'https://easypaisa.com.pk/';
    const epIconUrl = set.easypaisa && set.easypaisa.iconUrl ? set.easypaisa.iconUrl.trim() : '';
    const epContent = epIconUrl ? `<img src="${epIconUrl}" alt="Easypaisa" class="w-7 h-7 rounded-full object-cover">` : `<svg class="w-7 h-7" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="20" fill="#00B140"/><path d="M22 28H78V38H34V46H72V56H34V72H22V28Z" fill="white"/><circle cx="72" cy="67" r="6" fill="#8DC63F"/></svg>`;
    html += `
      <a href="${epLink}" target="_blank" rel="noopener noreferrer" class="bg-[#00B140] hover:bg-[#009b38] text-white font-bold p-3 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center border-2 border-white/25 relative group" title="Easypaisa App">
        <span class="absolute right-14 bg-charcoal text-emerald-400 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-emerald-500/30">Easypaisa (${set.easypaisa?.accountNumber || ''})</span>
        ${epContent}
      </a>`;
  }
  const jcEnabled = !set.jazzcash || set.jazzcash.enabled !== false;
  if (jcEnabled) {
    const jcLink = (set.jazzcash && set.jazzcash.appLink) || 'https://www.jazzcash.com.pk/';
    const jcIconUrl = set.jazzcash && set.jazzcash.iconUrl ? set.jazzcash.iconUrl.trim() : '';
    const jcContent = jcIconUrl ? `<img src="${jcIconUrl}" alt="JazzCash" class="w-7 h-7 rounded-full object-cover">` : `<svg class="w-7 h-7" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="100" rx="20" fill="#111111"/><path d="M20 50C20 33.4315 33.4315 20 50 20C66.5685 20 80 33.4315 80 50C80 66.5685 66.5685 80 50 80" stroke="#FFC400" stroke-width="8" stroke-linecap="round"/><path d="M50 35V65M38 48L62 48" stroke="#E61C24" stroke-width="8" stroke-linecap="round"/><circle cx="50" cy="50" r="10" fill="#E61C24"/></svg>`;
    html += `
      <a href="${jcLink}" target="_blank" rel="noopener noreferrer" class="bg-[#111111] hover:bg-[#000000] text-white font-bold p-3 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center border-2 border-[#E61C24]/60 relative group" title="JazzCash App">
        <span class="absolute right-14 bg-charcoal text-red-400 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-red-500/30">JazzCash (${set.jazzcash?.accountNumber || ''})</span>
        ${jcContent}
      </a>`;
  }
  const cleanWa = (set.whatsappNumber || '+923254090601').replace(/[^0-9]/g, '');
  html += `
    <a id="floating-wa-btn" href="https://wa.me/${cleanWa}" target="_blank" rel="noopener noreferrer" class="bg-emerald-500 hover:bg-emerald-400 text-black font-bold p-3.5 rounded-full shadow-2xl transition-all hover:scale-110 flex items-center justify-center border-2 border-white/20 relative group" title="WhatsApp Concierge">
      <span class="absolute right-14 bg-charcoal text-emerald-400 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg border border-emerald-500/30">WhatsApp</span>
      <i class="fa-brands fa-whatsapp text-2xl text-black"></i>
    </a>`;
  container.innerHTML = html;
}

function openAdminAuthModal() {
  document.getElementById('admin-password-input').value = '';
  document.getElementById('admin-auth-modal').classList.remove('hidden');
}

function closeAdminAuthModal() {
  document.getElementById('admin-auth-modal').classList.add('hidden');
}

function handleAdminLogin(e) {
  e.preventDefault();
  const pwd = document.getElementById('admin-password-input').value;
  const correctPwd = storeData.settings.adminPassword || 'admin';
  if (pwd === correctPwd) {
    closeAdminAuthModal();
    openAdminDashboard();
    showToast('Admin authenticated successfully.');
  } else {
    showToast('Incorrect admin password.');
  }
}

function openAdminDashboard() {
  populateAdminOrders();
  populateAdminProducts();
  populateAdminCatalogs();
  populateAdminCouriers();
  populateSettingsFields();
  document.getElementById('admin-dashboard-modal').classList.remove('hidden');
}

function closeAdminDashboard() {
  document.getElementById('admin-dashboard-modal').classList.add('hidden');
  renderShopHierarchy();
}

function switchAdminTab(tabName) {
  document.querySelectorAll('.admin-tab-content').forEach(el => el.classList.add('hidden'));
  document.getElementById('admin-tab-' + tabName).classList.remove('hidden');
  document.querySelectorAll('.admin-tab-btn').forEach(btn => {
    btn.className = "admin-tab-btn px-4 py-2 rounded-xl text-xs font-semibold glass-card text-gray-300 hover:text-gold-400";
  });
  document.getElementById('tab-btn-' + tabName).className = "admin-tab-btn px-4 py-2 rounded-xl text-xs font-semibold bg-gold-500 text-black";
}

function populateAdminOrders() {
  const tbody = document.getElementById('admin-orders-tbody');
  if (!tbody) return;
  if (storeData.orders.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="p-6 text-center text-gray-400">No client orders recorded yet.</td></tr>';
    return;
  }
  tbody.innerHTML = storeData.orders.map((o, idx) => `
    <tr class="hover:bg-gold-500/5 transition-colors">
      <td class="p-3 font-mono font-bold text-gold-400">${o.orderId}</td>
      <td class="p-3">
        <div class="font-bold text-white">${o.name}</div>
        <div class="text-[10px] text-gray-400 font-mono">${o.phone}</div>
        <div class="text-[10px] text-gray-400 truncate max-w-xs">${o.address}</div>
      </td>
      <td class="p-3">
        <div class="text-white font-semibold">Rs. ${o.total.toLocaleString()}</div>
        <div class="text-[10px] text-gray-400">${o.items.length} items (${o.payment})</div>
      </td>
      <td class="p-3 font-mono text-gray-300">${o.courier}</td>
      <td class="p-3">
        <select onchange="updateOrderStatus(${idx}, this.value)" class="bg-onyx border border-gold-500/30 rounded-lg p-1.5 text-xs text-gold-400 focus:outline-none">
          <option value="Processing" ${o.status === 'Processing' ? 'selected' : ''}>Processing</option>
          <option value="Dispatched" ${o.status === 'Dispatched' ? 'selected' : ''}>Dispatched</option>
          <option value="Delivered" ${o.status === 'Delivered' ? 'selected' : ''}>Delivered</option>
          <option value="Cancelled" ${o.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </td>
      <td class="p-3 text-right">
        <button onclick="deleteOrder(${idx})" class="px-2.5 py-1 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white text-xs">Delete</button>
      </td>
    </tr>`).join('');
}

async function updateOrderStatus(idx, status) {
  storeData.orders[idx].status = status;
  await syncStoreData();
  showToast('Order status updated.');
}

async function deleteOrder(idx) {
  storeData.orders.splice(idx, 1);
  await syncStoreData();
  populateAdminOrders();
  showToast('Order deleted.');
}

function populateAdminProducts() {
  const list = document.getElementById('admin-products-list');
  if (!list) return;
  list.innerHTML = storeData.products.map((p, idx) => {
    const imgs = getProductImages(p);
    return `
      <div class="glass-card p-4 rounded-xl flex items-center gap-4">
        <img src="${imgs[0]}" alt="${p.name}" class="w-16 h-16 object-cover rounded-lg">
        <div class="flex-1 min-w-0">
          <span class="text-[9px] uppercase tracking-widest text-gold-400">${p.category} / ${p.catalog || 'General'}</span>
          <h4 class="font-serif text-xs font-bold text-white truncate">${p.name}</h4>
          <p class="text-xs text-gold-400 font-semibold mt-0.5">Rs. ${p.price.toLocaleString()} (${imgs.length} imgs)</p>
        </div>
        <div class="flex flex-col gap-1.5">
          <button onclick="openEditProductModal(${idx})" class="px-2.5 py-1 rounded-md bg-gold-500/15 text-gold-400 hover:bg-gold-500 hover:text-black text-[10px] font-semibold">Edit</button>
          <button onclick="deleteProduct(${idx})" class="px-2.5 py-1 rounded-md bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white text-[10px] font-semibold">Delete</button>
        </div>
      </div>`;
  }).join('');
}

function openAddProductModal() {
  document.getElementById('modal-product-title').innerText = 'Add New Masterpiece';
  document.getElementById('edit-prod-id').value = '';
  document.getElementById('edit-prod-name').value = '';
  document.getElementById('edit-prod-price').value = '';
  document.getElementById('edit-prod-imgs').value = '';
  document.getElementById('edit-prod-desc').value = '';
  populateCatalogSelectForProduct();
  document.getElementById('product-edit-modal').classList.remove('hidden');
}

function openEditProductModal(idx) {
  const p = storeData.products[idx];
  document.getElementById('modal-product-title').innerText = 'Edit Masterpiece';
  document.getElementById('edit-prod-id').value = p.id;
  document.getElementById('edit-prod-name').value = p.name;
  document.getElementById('edit-prod-cat').value = p.category;
  populateCatalogSelectForProduct(p.catalog);
  document.getElementById('edit-prod-price').value = p.price;
  const imgs = getProductImages(p);
  document.getElementById('edit-prod-imgs').value = imgs.join(', ');
  document.getElementById('edit-prod-desc').value = p.description;
  document.getElementById('product-edit-modal').classList.remove('hidden');
}

function closeProductEditModal() {
  document.getElementById('product-edit-modal').classList.add('hidden');
}

function populateCatalogSelectForProduct(selectedCatalogName = '') {
  const col = document.getElementById('edit-prod-cat').value;
  const select = document.getElementById('edit-prod-catalog-select');
  if (!select) return;
  const matching = storeData.catalogs.filter(c => c.collection === col);
  select.innerHTML = matching.map(c => `<option value="${c.name}" ${c.name === selectedCatalogName ? 'selected' : ''}>${c.name}</option>`).join('');
}

async function saveProductData() {
  const id = document.getElementById('edit-prod-id').value;
  const name = document.getElementById('edit-prod-name').value.trim();
  const category = document.getElementById('edit-prod-cat').value;
  const catalog = document.getElementById('edit-prod-catalog-select').value;
  const price = parseFloat(document.getElementById('edit-prod-price').value) || 0;
  const imgsRaw = document.getElementById('edit-prod-imgs').value.trim();
  const description = document.getElementById('edit-prod-desc').value.trim();

  if (!name || !price) {
    showToast('Please provide product name and price.');
    return;
  }
  const images = imgsRaw ? imgsRaw.split(/[\n,]+/).map(s => s.trim()).filter(Boolean) : ['https://placehold.co/600x750/0a0a0a/d4af37?text=AVELON'];

  if (id) {
    const p = storeData.products.find(item => item.id === id);
    if (p) {
      p.name = name;
      p.category = category;
      p.catalog = catalog;
      p.price = price;
      p.images = images;
      p.description = description;
    }
  } else {
    const newP = {
      id: 'prod-' + Date.now(),
      name,
      category,
      catalog,
      price,
      images,
      description
    };
    storeData.products.push(newP);
  }
  await syncStoreData();
  closeProductEditModal();
  populateAdminProducts();
  showToast('Masterpiece saved successfully.');
}

async function deleteProduct(idx) {
  storeData.products.splice(idx, 1);
  await syncStoreData();
  populateAdminProducts();
  showToast('Masterpiece deleted.');
}

function populateAdminCatalogs() {
  const list = document.getElementById('admin-catalogs-list');
  if (!list) return;
  list.innerHTML = storeData.catalogs.map((c, idx) => `
    <div class="glass-card p-4 rounded-xl flex items-center justify-between gap-4">
      <div>
        <span class="text-[9px] uppercase tracking-widest text-gold-400">${c.collection}</span>
        <h4 class="font-serif text-sm font-bold text-white">${c.name}</h4>
      </div>
      <div class="flex gap-2">
        <button onclick="openEditCatalogModal(${idx})" class="px-3 py-1.5 rounded-lg bg-gold-500/15 text-gold-400 hover:bg-gold-500 hover:text-black text-xs font-semibold">Edit</button>
        <button onclick="deleteCatalog(${idx})" class="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white text-xs">Delete</button>
      </div>
    </div>`).join('');
}

function openAddCatalogModal() {
  document.getElementById('modal-catalog-title').innerText = 'Add New Catalog';
  document.getElementById('edit-catalog-id').value = '';
  document.getElementById('edit-cat-name').value = '';
  document.getElementById('catalog-edit-modal').classList.remove('hidden');
}

function openEditCatalogModal(idx) {
  const c = storeData.catalogs[idx];
  document.getElementById('modal-catalog-title').innerText = 'Edit Catalog';
  document.getElementById('edit-catalog-id').value = c.id;
  document.getElementById('edit-cat-collection').value = c.collection;
  document.getElementById('edit-cat-name').value = c.name;
  document.getElementById('catalog-edit-modal').classList.remove('hidden');
}

function closeCatalogEditModal() {
  document.getElementById('catalog-edit-modal').classList.add('hidden');
}

async function saveCatalogData() {
  const id = document.getElementById('edit-catalog-id').value;
  const collection = document.getElementById('edit-cat-collection').value;
  const name = document.getElementById('edit-cat-name').value.trim();
  if (!name) {
    showToast('Please provide a catalog name.');
    return;
  }
  if (id) {
    const c = storeData.catalogs.find(item => item.id === id);
    if (c) {
      c.collection = collection;
      c.name = name;
    }
  } else {
    const newC = {
      id: 'cat-' + Date.now(),
      collection,
      name
    };
    storeData.catalogs.push(newC);
  }
  await syncStoreData();
  closeCatalogEditModal();
  populateAdminCatalogs();
  showToast('Catalog saved successfully.');
}

async function deleteCatalog(idx) {
  storeData.catalogs.splice(idx, 1);
  await syncStoreData();
  populateAdminCatalogs();
  showToast('Catalog deleted.');
}

function populateAdminCouriers() {
  const list = document.getElementById('admin-couriers-list');
  if (!list) return;
  list.innerHTML = storeData.couriers.map((c, idx) => `
    <div class="glass-card p-4 rounded-xl flex items-center justify-between gap-4">
      <div class="min-w-0">
        <h4 class="font-serif text-sm font-bold text-white">${c.name}</h4>
        <p class="text-[11px] text-gray-400 font-mono truncate mt-0.5">${c.urlTemplate}</p>
      </div>
      <div class="flex gap-2">
        <button onclick="openEditCourierModal(${idx})" class="px-3 py-1.5 rounded-lg bg-gold-500/15 text-gold-400 hover:bg-gold-500 hover:text-black text-xs font-semibold">Edit</button>
        <button onclick="deleteCourier(${idx})" class="px-3 py-1.5 rounded-lg bg-red-500/15 text-red-400 hover:bg-red-500 hover:text-white text-xs">Delete</button>
      </div>
    </div>`).join('');
}

function openAddCourierModal() {
  document.getElementById('edit-courier-idx').value = '';
  document.getElementById('edit-courier-name').value = '';
  document.getElementById('edit-courier-url').value = '';
  document.getElementById('courier-edit-modal').classList.remove('hidden');
}

function openEditCourierModal(idx) {
  const c = storeData.couriers[idx];
  document.getElementById('edit-courier-idx').value = idx;
  document.getElementById('edit-courier-name').value = c.name;
  document.getElementById('edit-courier-url').value = c.urlTemplate;
  document.getElementById('courier-edit-modal').classList.remove('hidden');
}

function closeCourierEditModal() {
  document.getElementById('courier-edit-modal').classList.add('hidden');
}

async function saveCourierData() {
  const idx = document.getElementById('edit-courier-idx').value;
  const name = document.getElementById('edit-courier-name').value.trim();
  const urlTemplate = document.getElementById('edit-courier-url').value.trim();
  if (!name || !urlTemplate) {
    showToast('Please provide courier name and tracking URL template.');
    return;
  }
  if (idx !== '') {
    storeData.couriers[idx] = { name, urlTemplate };
  } else {
    storeData.couriers.push({ name, urlTemplate });
  }
  await syncStoreData();
  closeCourierEditModal();
  populateAdminCouriers();
  showToast('Courier saved successfully.');
}

async function deleteCourier(idx) {
  storeData.couriers.splice(idx, 1);
  await syncStoreData();
  populateAdminCouriers();
  showToast('Courier deleted.');
}

function populateSettingsFields() {
  const s = storeData.settings;
  document.getElementById('setting-ig-url').value = s.instagramUrl || '';
  document.getElementById('setting-fb-url').value = s.facebookUrl || '';
  document.getElementById('setting-tiktok-url').value = s.tiktokUrl || '';
  document.getElementById('setting-wa-num').value = s.whatsappNumber || '';
  const ep = s.easypaisa || {};
  document.getElementById('setting-ep-name').value = ep.accountName || '';
  document.getElementById('setting-ep-num').value = ep.accountNumber || '';
  document.getElementById('setting-ep-link').value = ep.appLink || '';
  document.getElementById('setting-ep-icon').value = ep.iconUrl || '';
  document.getElementById('setting-ep-toggle').checked = ep.enabled !== false;
  const jc = s.jazzcash || {};
  document.getElementById('setting-jc-name').value = jc.accountName || '';
  document.getElementById('setting-jc-num').value = jc.accountNumber || '';
  document.getElementById('setting-jc-link').value = jc.appLink || '';
  document.getElementById('setting-jc-icon').value = jc.iconUrl || '';
  document.getElementById('setting-jc-toggle').checked = jc.enabled !== false;
}

async function saveStoreSettings() {
  storeData.settings.instagramUrl = document.getElementById('setting-ig-url').value.trim();
  storeData.settings.facebookUrl = document.getElementById('setting-fb-url').value.trim();
  storeData.settings.tiktokUrl = document.getElementById('setting-tiktok-url').value.trim();
  storeData.settings.whatsappNumber = document.getElementById('setting-wa-num').value.trim();
  await syncStoreData();
  applySettingsToUI();
  showToast('Store settings saved successfully.');
}

async function savePaymentSettings() {
  storeData.settings.easypaisa = {
    enabled: document.getElementById('setting-ep-toggle').checked,
    accountName: document.getElementById('setting-ep-name').value.trim(),
    accountNumber: document.getElementById('setting-ep-num').value.trim(),
    appLink: document.getElementById('setting-ep-link').value.trim(),
    iconUrl: document.getElementById('setting-ep-icon').value.trim()
  };
  storeData.settings.jazzcash = {
    enabled: document.getElementById('setting-jc-toggle').checked,
    accountName: document.getElementById('setting-jc-name').value.trim(),
    accountNumber: document.getElementById('setting-jc-num').value.trim(),
    appLink: document.getElementById('setting-jc-link').value.trim(),
    iconUrl: document.getElementById('setting-jc-icon').value.trim()
  };
  await syncStoreData();
  renderFloatingPaymentShortcuts();
  showToast('Mobile payment settings saved successfully.');
}

function applySettingsToUI() {
  const s = storeData.settings;
  const footerIg = document.getElementById('footer-link-instagram');
  const footerFb = document.getElementById('footer-link-facebook');
  const footerTk = document.getElementById('footer-link-tiktok');
  if (footerIg) footerIg.href = s.instagramUrl || '#';
  if (footerFb) footerFb.href = s.facebookUrl || '#';
  if (footerTk) footerTk.href = s.tiktokUrl || '#';
  const cleanWa = (s.whatsappNumber || '+923254090601').replace(/[^0-9]/g, '');
  const aboutWa = document.getElementById('about-wa-btn');
  const aboutDisp = document.getElementById('about-wa-display');
  if (aboutWa) aboutWa.href = `https://wa.me/${cleanWa}`;
  if (aboutDisp) aboutDisp.innerText = s.whatsappNumber || '+92 325 4090601';
}

async function handleUpdatePassword() {
  const newPwd = document.getElementById('new-admin-pwd').value.trim();
  if (!newPwd) {
    showToast('Please enter a new password.');
    return;
  }
  storeData.settings.adminPassword = newPwd;
  await syncStoreData();
  document.getElementById('new-admin-pwd').value = '';
  showToast('Admin password updated successfully.');
}