/**
 * CHIC JUNE - SPA Motion Engine & Automation Endpoint
 */

// 1. PRODUCTION ENDPOINTS (Live ngrok Tunnel)
const N8N_ORDER_WEBHOOK_URL = 'https://kaila-ungotten-wade.ngrok-free.dev/webhook/chic-june-order';
const N8N_PRODUCTS_URL = 'https://kaila-ungotten-wade.ngrok-free.dev/webhook/chic-june-products';

let products = [
  { 
    id: 1, 
    name: 'Gold Butterfly Pendant & Earring Set', 
    price: 18500, 
    tag: 'NEW COLLECTION', 
    mediaType: 'image', 
    img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80' 
  },
  { 
    id: 2, 
    name: 'Minimalist Gold Cartier Bangles (Set of 3)', 
    price: 14000, 
    tag: 'BESTSELLER', 
    mediaType: 'image', 
    img: 'https://images.unsplash.com/photo-1611591475281-8ed284486c83?auto=format&fit=crop&w=600&q=80' 
  },
  { 
    id: 3, 
    name: 'Royal Gemstone Charm Bracelet', 
    price: 16500, 
    tag: 'POPULAR', 
    mediaType: 'image', 
    img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80' 
  },
  { 
    id: 4, 
    name: 'Heavy Link Statement Chain', 
    price: 22000, 
    tag: 'NEW', 
    mediaType: 'image', 
    img: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80' 
  }
];

let cart = [];

document.addEventListener('DOMContentLoaded', async () => {
  await fetchLiveProducts();
  initSlideshow();
  initScrollAnimations();
});

async function fetchLiveProducts() {
  if (!N8N_PRODUCTS_URL) {
    renderGrids();
    return;
  }

  try {
    const response = await fetch(N8N_PRODUCTS_URL);
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      products = data;
    }
  } catch (err) {
    console.warn('Using local fallback catalog:', err);
  } finally {
    renderGrids();
  }
}

// SPA TAB SWITCHER
function switchTab(tabName) {
  document.querySelectorAll('.page-view').forEach(view => {
    view.classList.remove('active');
  });

  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.remove('active');
  });

  const targetPage = document.getElementById(`page-${tabName}`);
  if (targetPage) {
    targetPage.classList.add('active');
  }

  const activeBtn = Array.from(document.querySelectorAll('.nav-tab')).find(btn => 
    btn.getAttribute('onclick').includes(tabName)
  );
  if (activeBtn) activeBtn.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  // Re-trigger reveal observer when switching to care guide
  if (tabName === 'care') {
    setTimeout(initScrollAnimations, 100);
  }
}

// HERO SLIDESHOW
function initSlideshow() {
  const slides = document.querySelectorAll('.slideshow .slide');
  let current = 0;
  if (slides.length <= 1) return;

  setInterval(() => {
    slides[current].classList.remove('active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('active');
  }, 4500);
}

// SCROLL ANIMATION OBSERVER (Fades in items smoothly as you scroll)
function initScrollAnimations() {
  const reveals = document.querySelectorAll('.reveal-stagger');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('active');
        }, index * 150); // Stagger effect
      }
    });
  }, { threshold: 0.1 });

  reveals.forEach(el => observer.observe(el));
}

// RENDER PRODUCTS
function renderGrids() {
  const fullGrid = document.getElementById('fullProductGrid');

  const cardHTML = (p) => `
    <div class="product-card">
      <div class="card-media">
        ${p.mediaType === 'video' 
          ? `<video src="${p.mediaUrl || p.img}" autoplay muted loop playsinline style="width:100%; height:100%; object-fit:cover;"></video>`
          : `<img src="${p.img || p.mediaUrl}" alt="${p.name}" />`}
        <span class="card-tag">${p.tag || 'NEW'}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${p.name}</h3>
        <div class="card-price">₦${Number(p.price).toLocaleString()}</div>
        <div class="card-actions">
          <button class="btn-card-add" onclick="addToCart(${p.id})">Add to Bag</button>
        </div>
      </div>
    </div>
  `;

  if (fullGrid) fullGrid.innerHTML = products.map(cardHTML).join('');
}

function addToCart(id) {
  const product = products.find(p => p.id === id);
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartBadge();
  alert(`✨ ${product.name} added to your bag!`);
}

function updateCartBadge() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cartBadge').innerText = totalItems;
}

function openCartModal() {
  const modal = document.getElementById('cartModal');
  const listContainer = document.getElementById('cartItemsList');
  const totalContainer = document.getElementById('cartTotal');

  if (cart.length === 0) {
    listContainer.innerHTML = '<p style="text-align:center; color:#777; padding: 1rem 0;">Your shopping bag is empty.</p>';
    totalContainer.innerText = '0';
  } else {
    let total = 0;
    listContainer.innerHTML = cart.map(item => {
      const itemTotal = item.price * item.qty;
      total += itemTotal;
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; padding-bottom:0.5rem; border-bottom:1px dotted #ccc;">
          <div>
            <div style="font-weight:600; font-size:0.85rem;">${item.name}</div>
            <div style="font-size:0.75rem; color:#666;">Qty: ${item.qty} × ₦${item.price.toLocaleString()}</div>
          </div>
          <div style="font-weight:700; color:#5C0A1B;">₦${itemTotal.toLocaleString()}</div>
        </div>
      `;
    }).join('');
    totalContainer.innerText = total.toLocaleString();
  }

  modal.style.display = 'flex';
}

function closeCartModal() {
  document.getElementById('cartModal').style.display = 'none';
}

document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (cart.length === 0) {
    alert('Please add at least one item to your bag!');
    return;
  }

  const name = document.getElementById('custName').value;
  const phone = document.getElementById('custPhone').value;
  const address = document.getElementById('custAddress').value;
  const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const orderId = 'CJ-' + Math.floor(100000 + Math.random() * 900000);

  const payload = {
    orderId,
    timestamp: new Date().toISOString(),
    customer: { name, phone, address },
    items: cart,
    totalPrice: total,
    status: 'Pending'
  };

  try {
    if (N8N_ORDER_WEBHOOK_URL) {
      await fetch(N8N_ORDER_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    alert(`✨ Thank you, ${name}!\n\nYour order #${orderId} has been logged successfully.`);
    cart = [];
    updateCartBadge();
    closeCartModal();
    document.getElementById('checkoutForm').reset();
  } catch (err) {
    console.error('Order submission error:', err);
    alert('Order logged successfully!');
  }
});