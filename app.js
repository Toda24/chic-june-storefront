/**
 * CHIC JUNE - Complete Refurbished E-Commerce Engine (RAM-Cached Instant Media & Strict Auth)
 */

const N8N_ORDER_WEBHOOK_URL = 'https://n8n-production-ff983c45.up.railway.app/webhook/chic-june-order';
const N8N_PRODUCTS_URL = 'https://n8n-production-ff983c45.up.railway.app/webhook/chic-june-products';
const N8N_AUTH_WEBHOOK_URL = 'https://n8n-production-ff983c45.up.railway.app/webhook/chic-june-auth-otp';

const PAYSTACK_PUBLIC_KEY = 'pk_live_f0843f5e41a5cde7db5b1fb9d1d3373b4666fc8f';
const OFFICIAL_WHATSAPP_NUMBER = '2348167721448';

let currentCategory = 'All';
let searchQuery = '';
let selectedReviewStar = 5;
let pendingSignupUser = null;
let selectedShippingOption = null;
let currentShippingFee = 0;

// RAM Cache for videos so they download ONCE and play instantly across all tabs
const videoBlobCache = {};

const shippingRates = [
  { id: 'm5', title: 'MAINLAND 5', price: 3000, desc: 'AMUWO ODOFIN, OSHODI, FESTAC, OKOTA, AGO PALACE WAY' },
  { id: 'm1', title: 'MAINLAND 1', price: 4000, desc: 'IKEJA, OGBA, OJOTA, OGUDU, MARYLAND, KETU, GBAGADA, MAGODO, OMOLE, ILUPEJU, ONIPANU, OBANIKORO, YABA, AGEGE, BARIGA, MUSHIN' },
  { id: 'm2', title: 'MAINLAND 2', price: 4000, desc: 'SURULERE, AKOWONJO, OWORONSHOKI, AJAO ESTATE, FAGBA, BERGER, OBAWOLE, COLLEGE ROAD, IFAKO IJAIYE, ISOLO, IGANDO, IKOTUN, DOPEMU' },
  { id: 'm3', title: 'MAINLAND 3', price: 5000, desc: 'EBUTE METTA, IYANA IPAJA, IJEGUN, ABULE EGBA, AYOBO, AKUTE, APAPA, ALABA, ISHERI OSHUN' },
  { id: 'm4', title: 'MAINLAND 4', price: 6000, desc: 'IKORODU, BADAGRY, LASU, OJO, ABARANJE, KOLA AGBADO' },
  { id: 'is1', title: 'ISLAND 1', price: 4000, desc: 'MARINA, VI, IKOYI, OBALENDE' },
  { id: 'is2', title: 'ISLAND 2', price: 6000, desc: 'LEKKI PHASE 1&2, ONIRU, OSAPA LONDON, IKATE, JAKANDE, AGUNGI, VGC, CHEVRON' },
  { id: 'is3', title: 'ISLAND 3', price: 6000, desc: 'AJAH, AWOYAYA, SANGOTEDO' },
  { id: 'is4', title: 'ISLAND 4', price: 8000, desc: 'IBEJU LEKKI, EPE, DANGOTE REFINERY' },
  { id: 'way_west', title: 'WAYBILL WEST (PARK)', price: 5000, desc: 'OSUN, OYO, EKITI, KWARA, ONDO, OGUN (ILARO, SAGAMU, SANGO, MOWE, IFO)' },
  { id: 'gig_west', title: 'GIG WEST / EDO STATE', price: 6500, desc: 'OYO, OSUN, ONDO, OGUN, KWARA, EKITI, EDO' },
  { id: 'gig_east', title: 'GIG EAST / SOUTH / ABUJA', price: 7500, desc: 'ENUGU, IMO, ABIA, BAYELSA, ANAMBRA, CALABAR, DELTA, EBONYI, PORT HARCOURT, AKWA IBOM, ABUJA' },
  { id: 'gig_north', title: 'GIG NORTH', price: 8500, desc: 'JOS, KANO, MAKURDI, KADUNA, ADAMAWA, GOMBE, JIGAWA, ZAMFARA, ETC.' }
];

let products = [
  { id: 1, name: 'Milan Shijia Gold Sculpted Drop Earrings', category: 'Earrings', price: 4000, tag: 'NEW COLLECTION', mediaType: 'image', img: 'images/pic3.jpeg', desc: 'S925 Post luxury gold sculpted fluid drop earrings featuring polished curves.', reviews: [], dateAdded: '2026-01-01' },
  { id: 2, name: 'Uglyver Gold Ruffled Petal Earrings', category: 'Earrings', price: 4000, tag: 'BESTSELLER', mediaType: 'image', img: 'images/pic4.jpeg', desc: 'Exquisite gold-plated ruffled petal hoop earrings with secure backing.', reviews: [], dateAdded: '2026-01-02' },
  { id: 3, name: 'Sculpted Golden Wave Bracelet Set', category: 'Bracelets', price: 4500, tag: 'TRENDING', mediaType: 'video', img: 'images/GIF1.mp4', desc: 'Signature gold statement bracelet set captured live in studio.', reviews: [], dateAdded: '2026-01-03' },
  { id: 4, name: 'Royal Heritage Gold Chain & Pendant', category: 'Necklaces', price: 5000, tag: 'POPULAR', mediaType: 'video', img: 'images/GIF2.mp4', desc: 'Tarnish-resistant luxury gold chain designed for everyday elegance.', reviews: [], dateAdded: '2026-01-04' }
];

let cart = [];
let activeQvProduct = null;
let activeQvQty = 1;

function formatDriveUrl(url) {
  if (!url) return '';
  if (!url.includes('drive.google.com')) return url;
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://n8n-production-ff983c45.up.railway.app/webhook/chic-june-media?id=${match[1]}`;
  }
  return url;
}

async function preloadAndCacheVideo(rawUrl) {
  if (!rawUrl || videoBlobCache[rawUrl]) return videoBlobCache[rawUrl] || rawUrl;
  try {
    const res = await fetch(rawUrl, {
      headers: { 'ngrok-skip-browser-warning': 'true' }
    });
    if (!res.ok) return rawUrl;
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    videoBlobCache[rawUrl] = blobUrl;

    document.querySelectorAll(`video[data-raw-src="${rawUrl}"]`).forEach(vid => {
      if (vid.src !== blobUrl) {
        vid.src = blobUrl;
        vid.play().catch(() => {});
      }
    });
    return blobUrl;
  } catch (e) {
    return rawUrl;
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  buildCatalogDOM();
  initDynamicSlideshow();
  await fetchLiveProducts();
  loadSavedCustomerAccount();
  renderShippingOptions(shippingRates);
});

async function fetchLiveProducts() {
  if (!N8N_PRODUCTS_URL) return;
  try {
    const response = await fetch(N8N_PRODUCTS_URL, {
      method: 'GET',
      mode: 'cors',
      headers: {
        'Accept': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      }
    });
    if (!response.ok) throw new Error('Network response failed');
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      products = data.map(item => ({
        ...item,
        category: item.category ? item.category.trim() : 'All',
        img: formatDriveUrl(item.img || item.image || item.mediaUrl),
        reviews: item.reviews || [],
        dateAdded: item.dateAdded || item.timestamp || '2026-01-01'
      }));
      buildCatalogDOM();
      initDynamicSlideshow();
    }
  } catch (err) {
    console.warn('Using local fallback catalog:', err);
  }
}

function switchTab(tabName) {
  document.querySelectorAll('.page-view').forEach(view => view.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));

  const targetPage = document.getElementById(`page-${tabName}`);
  if (targetPage) targetPage.classList.add('active');

  document.querySelectorAll('.nav-tab').forEach(btn => {
    const fn = btn.getAttribute('onclick') || '';
    if (fn.includes(`'${tabName}'`)) btn.classList.add('active');
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (tabName === 'care') resetAndTriggerCareMotion();
  if (tabName === 'catalog') {
    applyCatalogFilters();
    document.querySelectorAll('#fullProductGrid video').forEach(v => v.play().catch(() => {}));
  }
  if (tabName === 'checkout') renderCheckoutSummary();
}

function exploreCatalogFromAbout() {
  const allTabBtn = document.querySelector('.cat-tab');
  filterCategory('All', allTabBtn);
  switchTab('catalog');
}

function initDynamicSlideshow() {
  const container = document.querySelector('.hero-slideshow-container .slideshow');
  if (!container) return;

  const sortedByDate = [...products].sort((a, b) => new Date(a.dateAdded || 0) - new Date(b.dateAdded || 0));
  const imageItems = sortedByDate.filter(p => p.mediaType !== 'video');
  const slideItems = (imageItems.length > 0 ? imageItems : sortedByDate).slice(0, 5);

  if (slideItems.length === 0) return;

  container.innerHTML = slideItems.map((item, idx) => {
    const mediaSrc = formatDriveUrl(item.img || item.mediaUrl);
    const bgUrl = item.mediaType === 'video' ? 'images/pic4.jpeg' : mediaSrc;
    return `<div class="slide ${idx === 0 ? 'active' : ''}" style="background-image: url('${bgUrl}');"></div>`;
  }).join('');

  const slides = container.querySelectorAll('.slide');
  if (slides.length <= 1) return;

  let current = 0;
  if (window._heroSlideInterval) clearInterval(window._heroSlideInterval);
  window._heroSlideInterval = setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 4500);
}

function handleSearch(query) {
  searchQuery = query.toLowerCase().trim();
  applyCatalogFilters();

  const dropdown = document.getElementById('searchAutocompleteDropdown');
  if (!dropdown) return;

  if (!searchQuery) {
    dropdown.style.display = 'none';
    return;
  }

  const matches = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery) ||
    (p.category && p.category.toLowerCase().includes(searchQuery))
  );

  if (matches.length > 0) {
    dropdown.style.display = 'block';
    dropdown.innerHTML = matches.slice(0, 5).map(m => `
      <div onclick="selectAutocompleteItem('${m.name.replace(/'/g, "\\'")}')" style="padding: 0.6rem 1rem; cursor: pointer; border-bottom: 1px solid #f0f0f0; color: #1a1a1a; font-size: 0.8rem;">
        <strong>${m.name}</strong> <span style="color: var(--gold); float: right;">₦${Number(m.price).toLocaleString()}</span>
      </div>
    `).join('');
  } else {
    dropdown.style.display = 'none';
  }
}

function selectAutocompleteItem(name) {
  const input = document.getElementById('globalSearchInput');
  if (input) input.value = name;
  searchQuery = name.toLowerCase().trim();
  const dropdown = document.getElementById('searchAutocompleteDropdown');
  if (dropdown) dropdown.style.display = 'none';
  switchTab('catalog');
  applyCatalogFilters();
}

function filterCategory(category, btnEl) {
  currentCategory = category;
  document.querySelectorAll('.cat-tab').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');
  applyCatalogFilters();
}

function calculateRating(product) {
  if (!product.reviews || product.reviews.length === 0) {
    return { average: 0, text: '⭐ No reviews yet' };
  }
  const sum = product.reviews.reduce((acc, r) => acc + r.stars, 0);
  const avg = (sum / product.reviews.length).toFixed(1);
  return { average: avg, text: `⭐ ${avg} (${product.reviews.length} reviews)` };
}

function resetAndTriggerCareMotion() {
  const reveals = document.querySelectorAll('#page-care .reveal-stagger');
  reveals.forEach(el => el.classList.remove('active'));

  setTimeout(() => {
    const observer = new IntersectionObserver((entries, observerInstance) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const siblings = Array.from(entry.target.parentNode.children);
          const index = siblings.indexOf(entry.target);
          setTimeout(() => { entry.target.classList.add('active'); }, index * 80);
          observerInstance.unobserve(entry.target);
        }
      });
    }, { threshold: 0.05 });
    reveals.forEach(el => observer.observe(el));
  }, 20);
}

function buildCatalogDOM() {
  const fullGrid = document.getElementById('fullProductGrid');
  if (!fullGrid) return;

  fullGrid.innerHTML = products.map(p => {
    const ratingInfo = calculateRating(p);
    const rawSrc = formatDriveUrl(p.img || p.mediaUrl);
    const activeSrc = videoBlobCache[rawSrc] || rawSrc;

    if (p.mediaType === 'video' && !videoBlobCache[rawSrc]) {
      preloadAndCacheVideo(rawSrc);
    }

    return `
      <div class="product-card reveal-stagger active"
           data-id="${p.id}"
           data-cat="${(p.category || '').toLowerCase().trim()}"
           data-tag="${(p.tag || '').toUpperCase().trim()}"
           data-name="${(p.name || '').toLowerCase()}"
           data-desc="${(p.desc || '').toLowerCase()}"
           onclick="openProductModal(${p.id})">
        <div class="card-media">
          ${p.mediaType === 'video'
            ? `<video src="${activeSrc}" data-raw-src="${rawSrc}" autoplay muted loop playsinline webkit-playsinline preload="auto" style="width:100%; height:100%; object-fit:cover;"></video>`
            : `<img src="${rawSrc}" alt="${p.name}" loading="eager" />`}
          <span class="card-tag">${p.tag || 'NEW'}</span>
        </div>
        <div class="card-body">
          <h3 class="card-title">${p.name}</h3>
          <div class="card-rating-stars">${ratingInfo.text}</div>
          <div class="card-price">₦${Number(p.price).toLocaleString()}</div>
          <div class="card-actions">
            <button class="btn-card-add" onclick="event.stopPropagation(); addToCart(${p.id})">Add to Bag</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  applyCatalogFilters();
}

function applyCatalogFilters() {
  const fullGrid = document.getElementById('fullProductGrid');
  if (!fullGrid) return;

  const cards = fullGrid.querySelectorAll('.product-card');
  const targetCat = currentCategory.toLowerCase().trim();
  let visibleCount = 0;

  cards.forEach(card => {
    const pCat = card.getAttribute('data-cat');
    const pTag = card.getAttribute('data-tag');
    const pName = card.getAttribute('data-name');
    const pDesc = card.getAttribute('data-desc');

    const matchesCat = (targetCat === 'all') ||
                       (targetCat === 'new collection' && (pTag === 'NEW COLLECTION' || pTag === 'NEW')) ||
                       (pCat === targetCat);
    const matchesSearch = !searchQuery || pName.includes(searchQuery) || pDesc.includes(searchQuery);

    if (matchesCat && matchesSearch) {
      card.style.display = 'flex';
      visibleCount++;
      const vid = card.querySelector('video');
      if (vid && vid.paused) vid.play().catch(() => {});
    } else {
      card.style.display = 'none';
    }
  });

  let emptyMsg = document.getElementById('catalogEmptyMsg');
  if (visibleCount === 0) {
    if (!emptyMsg) {
      emptyMsg = document.createElement('p');
      emptyMsg.id = 'catalogEmptyMsg';
      emptyMsg.style.cssText = 'grid-column: 1/-1; text-align:center; color:#777; padding: 2rem 0;';
      emptyMsg.innerText = 'No jewelry pieces matched your search.';
      fullGrid.appendChild(emptyMsg);
    }
    emptyMsg.style.display = 'block';
  } else if (emptyMsg) {
    emptyMsg.style.display = 'none';
  }
}

function renderGrids() {
  buildCatalogDOM();
}

function openShippingModal() {
  document.getElementById('shippingModal').style.display = 'flex';
}

function closeShippingModal() {
  document.getElementById('shippingModal').style.display = 'none';
}

function renderShippingOptions(list) {
  const container = document.getElementById('shippingOptionsContainer');
  if (!container) return;

  container.innerHTML = list.map(opt => `
    <div class="shipping-option-card ${selectedShippingOption && selectedShippingOption.id === opt.id ? 'selected' : ''}" onclick="selectShippingRate('${opt.id}')">
      <input type="radio" name="shipOpt" ${selectedShippingOption && selectedShippingOption.id === opt.id ? 'checked' : ''}>
      <div class="shipping-option-info">
        <div class="shipping-option-title-row">
          <span>${opt.title}</span>
          <span class="shipping-option-price">₦${opt.price.toLocaleString()}</span>
        </div>
        <div class="shipping-option-desc">${opt.desc}</div>
      </div>
    </div>
  `).join('');
}

function filterShippingRates(query) {
  const q = query.toLowerCase().trim();
  const filtered = shippingRates.filter(r =>
    r.title.toLowerCase().includes(q) || r.desc.toLowerCase().includes(q)
  );
  renderShippingOptions(filtered);
}

function selectShippingRate(id) {
  const opt = shippingRates.find(r => r.id === id);
  if (!opt) return;

  selectedShippingOption = opt;
  currentShippingFee = opt.price;

  const displayBox = document.getElementById('selectedShippingDisplay');
  displayBox.style.display = 'block';
  displayBox.innerHTML = `<strong>${opt.title}</strong> — ₦${opt.price.toLocaleString()}<br><small style="color:#666;">${opt.desc}</small>`;

  renderShippingOptions(shippingRates);
  closeShippingModal();
  renderCheckoutSummary();
}

function renderCheckoutSummary() {
  const listContainer = document.getElementById('checkoutItemsList');
  if (cart.length === 0) {
    listContainer.innerHTML = '<p style="text-align:center; color:#777;">Your cart is empty.</p>';
  } else {
    listContainer.innerHTML = cart.map(item => `
      <div style="display:flex; justify-content:space-between; font-size:0.85rem; margin-bottom:0.5rem;">
        <span>${item.name} (x${item.qty})</span>
        <span style="font-weight:700;">₦${(item.price * item.qty).toLocaleString()}</span>
      </div>
    `).join('');
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const total = subtotal + (cart.length > 0 ? currentShippingFee : 0);

  document.getElementById('chkSubtotal').innerText = subtotal.toLocaleString();
  document.getElementById('chkShipping').innerText = currentShippingFee.toLocaleString();
  document.getElementById('chkTotal').innerText = total.toLocaleString();

  const saved = localStorage.getItem('cj_customer_account');
  if (saved) {
    const acc = JSON.parse(saved);
    document.getElementById('displayAuthUser').innerText = `${acc.firstName} (${acc.email}, ${acc.phone})`;
  } else {
    document.getElementById('displayAuthUser').innerText = 'Guest Customer (Login required)';
  }
}

function openProductModal(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;

  activeQvProduct = product;
  activeQvQty = 1;

  document.getElementById('qvTag').innerText = product.tag || 'NEW';
  document.getElementById('qvTitle').innerText = product.name;
  document.getElementById('qvPrice').innerText = `₦${Number(product.price).toLocaleString()}`;
  document.getElementById('qvDesc').innerText = product.desc || 'Bespoke luxury gold craftsmanship designed for effortless elegance.';
  document.getElementById('qvQtyVal').innerText = '1';

  const ratingInfo = calculateRating(product);
  document.getElementById('qvRatingStars').innerText = ratingInfo.text;
  document.getElementById('qvReviewCount').innerText = product.reviews ? `(${product.reviews.length} reviews)` : '(0 reviews)';

  const mediaBox = document.getElementById('qvMedia');
  const rawSrc = formatDriveUrl(product.img || product.mediaUrl);
  const activeSrc = videoBlobCache[rawSrc] || rawSrc;

  mediaBox.innerHTML = product.mediaType === 'video'
    ? `<video src="${activeSrc}" data-raw-src="${rawSrc}" autoplay muted loop playsinline webkit-playsinline preload="auto" style="width:100%; height:100%; object-fit:cover;"></video>`
    : `<img src="${rawSrc}" alt="${product.name}" />`;

  selectStarRating(5);
  document.getElementById('productModal').style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
}

function adjustQvQty(delta) {
  activeQvQty = Math.max(1, activeQvQty + delta);
  document.getElementById('qvQtyVal').innerText = activeQvQty;
}

function selectStarRating(val) {
  selectedReviewStar = val;
  document.querySelectorAll('#starSelect span').forEach(el => {
    const s = parseInt(el.getAttribute('data-star'));
    el.classList.toggle('selected', s <= val);
  });
}

function submitProductReview() {
  if (!activeQvProduct) return;
  const comment = document.getElementById('reviewComment').value.trim();
  if (!comment) { alert('Please write a quick review!'); return; }
  if (!activeQvProduct.reviews) activeQvProduct.reviews = [];
  activeQvProduct.reviews.push({ stars: selectedReviewStar, comment });
  alert('✨ Thank you! Your review has been published.');
  document.getElementById('reviewComment').value = '';
  openProductModal(activeQvProduct.id);
  buildCatalogDOM();
}

function checkAuthBeforeAction() {
  const saved = localStorage.getItem('cj_customer_account');
  if (!saved) {
    alert('✨ Please sign in or create an account to shop our exclusive luxury collection!');
    openAuthModal('login');
    return false;
  }
  return true;
}

function addQvToBag() {
  if (!checkAuthBeforeAction()) return;
  if (!activeQvProduct) return;
  const existing = cart.find(item => item.id === activeQvProduct.id);
  if (existing) { existing.qty += activeQvQty; }
  else { cart.push({ ...activeQvProduct, qty: activeQvQty }); }
  updateCartBadge();
  closeProductModal();
  alert(`✨ ${activeQvQty}x ${activeQvProduct.name} added to your bag!`);
}

function addToCart(id) {
  if (!checkAuthBeforeAction()) return;
  const product = products.find(p => p.id === id);
  const existing = cart.find(item => item.id === id);
  if (existing) { existing.qty += 1; }
  else { cart.push({ ...product, qty: 1 }); }
  updateCartBadge();
  alert(`✨ ${product.name} added to your bag!`);
}

function updateCartBadge() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cartBadge').innerText = totalItems;
}

function clearCart() {
  cart = [];
  updateCartBadge();
  openCartModal();
}

function openCartModal() {
  if (!checkAuthBeforeAction()) return;
  const modal = document.getElementById('cartModal');
  const listContainer = document.getElementById('cartItemsList');
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cartDrawerTitle').innerText = `Your Cart (${totalItems} items)`;

  if (cart.length === 0) {
    listContainer.innerHTML = '<p style="text-align:center; color:#777; padding: 2rem 0;">Your shopping bag is empty.</p>';
  } else {
    listContainer.innerHTML = cart.map(item => {
      const itemTotal = item.price * item.qty;
      const mediaSrc = formatDriveUrl(item.img || item.mediaUrl);
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; padding-bottom:0.8rem; border-bottom:1px solid var(--border);">
          <div style="display:flex; gap:0.8rem; align-items:center;">
            <div style="width:50px; height:50px; background:#F3EFEA; border-radius:8px; overflow:hidden; flex-shrink:0;">
              ${item.mediaType === 'video'
                ? `<video src="${videoBlobCache[mediaSrc] || mediaSrc}" muted loop playsinline style="width:100%; height:100%; object-fit:cover;"></video>`
                : `<img src="${mediaSrc}" loading="eager" style="width:100%; height:100%; object-fit:cover;">`}
            </div>
            <div>
              <div style="font-weight:600; font-size:0.85rem;">${item.name}</div>
              <div style="font-size:0.75rem; color:#666;">Qty: ${item.qty} × ₦${item.price.toLocaleString()}</div>
            </div>
          </div>
          <div style="font-weight:700; color:#5C0A1B; font-size:0.9rem;">₦${itemTotal.toLocaleString()}</div>
        </div>
      `;
    }).join('');
  }

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  document.getElementById('cartSubtotal').innerText = subtotal.toLocaleString();
  modal.style.display = 'flex';
}

function closeCartModal() {
  document.getElementById('cartModal').style.display = 'none';
}

function proceedToCheckoutPage() {
  if (!checkAuthBeforeAction()) return;
  if (cart.length === 0) {
    alert('Your shopping bag is empty! Please add at least one piece to your bag before proceeding.');
    return;
  }
  closeCartModal();
  switchTab('checkout');
}

function handleNewsletterSubmit(e) {
  e.preventDefault();
  const val = document.getElementById('newsletterInput').value.trim();
  if (!val) return;
  alert('✨ Thank you for subscribing to Chic June! You are officially on the VIP list.');
  document.getElementById('newsletterForm').reset();
}

async function processSuccessfulOrder(response, orderId, customerInfo, address, subtotal, totalAmount) {
  const payload = {
    orderId,
    paymentReference: response.reference,
    timestamp: new Date().toISOString(),
    customer: { ...customerInfo, address, shippingZone: selectedShippingOption.title, note: document.getElementById('custNote').value },
    items: cart,
    subtotal,
    shippingFee: currentShippingFee,
    totalPrice: totalAmount,
    status: 'PAID'
  };

  if (N8N_ORDER_WEBHOOK_URL) {
    try {
      await fetch(N8N_ORDER_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify(payload)
      });
    } catch (err) {
      console.error('n8n post error:', err);
    }
  }

  alert(`🎉 Payment Successful!\n\nReference: ${response.reference}\nThank you, ${customerInfo.firstName}! Valerie will prepare your order.`);
  cart = [];
  updateCartBadge();
  switchTab('home');
  document.getElementById('checkoutForm').reset();
}

document.getElementById('checkoutForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!checkAuthBeforeAction()) return;
  if (cart.length === 0) { alert('Please add at least one item to your bag!'); return; }
  if (!selectedShippingOption) { alert('Please click "SELECT A SHIPPING PRICE" to choose your delivery location!'); return; }

  const saved = localStorage.getItem('cj_customer_account');
  let customerInfo = { firstName: 'Valued', lastName: 'Customer', email: 'customer@chicjune.com', phone: '08000000000' };
  if (saved) { customerInfo = JSON.parse(saved); }

  const address = document.getElementById('custAddress').value;
  const note = document.getElementById('custNote').value;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalAmount = subtotal + currentShippingFee;
  const orderId = 'CJ-' + Math.floor(100000 + Math.random() * 900000);

  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: customerInfo.email,
    amount: totalAmount * 100,
    currency: 'NGN',
    ref: orderId,
    metadata: {
      custom_fields: [
        { display_name: "Customer Name", variable_name: "customer_name", value: `${customerInfo.firstName} ${customerInfo.lastName}` },
        { display_name: "Phone Number", variable_name: "phone_number", value: customerInfo.phone },
        { display_name: "Delivery Address", variable_name: "delivery_address", value: `${address}` },
        { display_name: "Shipping Zone", variable_name: "shipping_zone", value: `${selectedShippingOption.title} (₦${selectedShippingOption.price})` },
        { display_name: "Merchant Note", variable_name: "merchant_note", value: note }
      ]
    },
    callback: function(response) {
      processSuccessfulOrder(response, orderId, customerInfo, address, subtotal, totalAmount);
    },
    onClose: function() { alert('Payment window closed.'); }
  });

  handler.openIframe();
});

function handleAccountClick() {
  const saved = localStorage.getItem('cj_customer_account');
  if (saved) {
    const acc = JSON.parse(saved);
    if (confirm(`Hello ${acc.firstName} (${acc.email}). Would you like to log out?`)) {
      localStorage.removeItem('cj_customer_account');
      loadSavedCustomerAccount();
      alert('You have been logged out successfully.');
      openAuthModal('login');
    }
  } else {
    openAuthModal('login');
  }
}

function openAuthModal(mode = 'login') {
  document.getElementById('authModal').style.display = 'flex';
  switchAuthMode(mode);
}

function closeAuthModal() {
  document.getElementById('authModal').style.display = 'none';
}

function switchAuthMode(mode) {
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));

  if (mode === 'login') {
    document.getElementById('loginForm').classList.add('active');
    document.getElementById('authModalTitle').innerText = 'Sign In';
  } else if (mode === 'signup') {
    document.getElementById('signupForm').classList.add('active');
    document.getElementById('authModalTitle').innerText = 'Create Account';
  } else if (mode === 'forgot') {
    document.getElementById('forgotForm').classList.add('active');
    document.getElementById('authModalTitle').innerText = 'Reset Password';
  }
}

// STRICT REAL AUTH HANDLERS
document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Signing in...';

  try {
    const response = await fetch(N8N_AUTH_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({ action: 'LOGIN', email, password })
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.message || '❌ Invalid email or password. Please try again.');
      return;
    }

    const accountData = {
      firstName: result.user.firstName,
      lastName: result.user.lastName,
      email: result.user.email,
      phone: result.user.phone
    };

    localStorage.setItem('cj_customer_account', JSON.stringify(accountData));
    loadSavedCustomerAccount();
    closeAuthModal();
    alert(`✨ Welcome back, ${accountData.firstName}!`);
  } catch (err) {
    alert('⚠️ Unable to reach authentication server. Please ensure your backend is running.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Login';
  }
});

document.getElementById('signupForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const password = document.getElementById('signupPassword').value;
  const confirmPassword = document.getElementById('signupConfirmPassword').value;

  if (password !== confirmPassword) {
    alert('Passwords do not match! Please verify your password and try again.');
    return;
  }

  pendingSignupUser = {
    firstName: document.getElementById('signupFirstName').value.trim(),
    lastName: document.getElementById('signupLastName').value.trim(),
    email: document.getElementById('signupEmail').value.trim().toLowerCase(),
    phone: document.getElementById('signupPhone').value.trim(),
    password: password
  };

  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Checking & Sending Code...';

  try {
    const response = await fetch(N8N_AUTH_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ action: 'SIGNUP_REQUEST', user: pendingSignupUser })
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.message || '❌ An account with this email already exists. Please log in instead.');
      return;
    }

    document.getElementById('otpTargetEmail').innerText = pendingSignupUser.email;
    document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
    document.getElementById('otpForm').classList.add('active');
    document.getElementById('authModalTitle').innerText = 'Email Verification';
  } catch (err) {
    alert('⚠️ Could not send verification email. Check your n8n connection.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Send Verification Code';
  }
});

document.getElementById('forgotForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('forgotEmail').value.trim().toLowerCase();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Sending...';

  try {
    const response = await fetch(N8N_AUTH_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true'
      },
      body: JSON.stringify({ action: 'PASSWORD_RESET', email })
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.message || '❌ No account found with that email address.');
      return;
    }

    alert(`✨ ${result.message || 'Password recovery email sent! Check your inbox.'}`);
    switchAuthMode('login');
  } catch (err) {
    alert('⚠️ Unable to reach server.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Send Reset Link';
  }
});

document.getElementById('otpForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const code = document.getElementById('otpInput').value.trim();
  const submitBtn = e.target.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.innerText = 'Verifying...';

  try {
    const response = await fetch(N8N_AUTH_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
      body: JSON.stringify({
        action: 'VERIFY_OTP',
        email: pendingSignupUser.email,
        code: code
      })
    });
    const result = await response.json();

    if (!response.ok || !result.success) {
      alert(result.message || '❌ Incorrect or expired verification code. Check your email inbox and try again.');
      return;
    }

    const verifiedUser = {
      firstName: pendingSignupUser.firstName,
      lastName: pendingSignupUser.lastName,
      email: pendingSignupUser.email,
      phone: pendingSignupUser.phone
    };

    localStorage.setItem('cj_customer_account', JSON.stringify(verifiedUser));
    loadSavedCustomerAccount();
    closeAuthModal();
    document.getElementById('otpForm').reset();
    document.getElementById('signupForm').reset();
    alert(`🎉 Email Verified! Welcome to Chic June, ${verifiedUser.firstName}!`);
  } catch (err) {
    alert('⚠️ Verification failed due to a server error.');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerText = 'Verify Account & Sign In';
  }
});

function loadSavedCustomerAccount() {
  const saved = localStorage.getItem('cj_customer_account');
  const btn = document.getElementById('accountBtnText');
  if (!saved) {
    btn.innerText = '👤 Login';
    return;
  }
  const data = JSON.parse(saved);
  btn.innerText = `👤 ${data.firstName} (Logout)`;
}

function toggleWhatsAppPopup() {
  const popup = document.getElementById('waPopup');
  popup.style.display = (popup.style.display === 'block') ? 'none' : 'block';
}

function sendWhatsAppMessage() {
  const text = document.getElementById('waInputText').value.trim();
  if (!text) return;
  const encoded = encodeURIComponent(text);
  window.open(`https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}?text=${encoded}`, '_blank');
  document.getElementById('waInputText').value = '';
}

function handleWaKeypress(e) {
  if (e.key === 'Enter') sendWhatsAppMessage();
}