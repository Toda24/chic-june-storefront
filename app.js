/**
 * CHIC JUNE - Luxury E-Commerce Engine & Motion Controller
 */

// 1. CONFIGURATION & ENDPOINTS
// Replace N8N_ORDER_WEBHOOK_URL with your actual n8n production URL
const N8N_ORDER_WEBHOOK_URL = 'http://localhost:5678/webhook/chic-june-order';

// Catalog Products
const products = [
  { id: 1, name: 'Gold Butterfly Necklace Set', price: 18500, inStock: true, tag: 'BESTSELLER', img: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=600&q=80' },
  { id: 2, name: 'Minimalist Gold Bangles (Set of 3)', price: 14000, inStock: true, tag: 'NEW', img: 'https://images.unsplash.com/photo-1611591475281-8ed284486c83?auto=format&fit=crop&w=600&q=80' },
  { id: 3, name: 'Gemstone Charm Bracelet', price: 16500, inStock: true, tag: 'TRENDING', img: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=600&q=80' },
  { id: 4, name: 'Statement Gold Hoops', price: 12000, inStock: true, tag: 'CLASSIC', img: 'https://images.unsplash.com/photo-1630019852942-f89202989a59?auto=format&fit=crop&w=600&q=80' }
];

let cart = [];

// 2. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  renderProducts();
  initHeroSlideshow();
});

// 3. HERO SLIDESHOW ANIMATION CONTROLLER
function initHeroSlideshow() {
  const slides = document.querySelectorAll('.hero-slideshow .slide');
  let currentSlide = 0;

  if (slides.length <= 1) return;

  setInterval(() => {
    slides[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
  }, 5000); // 5-second smooth cross-fade transition
}

// 4. RENDER CATALOG CARDS
function renderProducts() {
  const grid = document.getElementById('productGrid');
  grid.innerHTML = products.map(p => `
    <div class="product-card">
      <div class="card-img-box">
        <img src="${p.img}" alt="${p.name}" />
        <span class="tag-new">${p.tag}</span>
      </div>
      <div class="card-info">
        <h3 class="card-title">${p.name}</h3>
        <div class="card-price">₦${p.price.toLocaleString()}</div>
        <button class="btn-add-cart" onclick="addToCart(${p.id})">Add to Cart</button>
      </div>
    </div>
  `).join('');
}

// 5. CART MANAGEMENT
function addToCart(id) {
  const product = products.find(p => p.id === id);
  const existing = cart.find(item => item.id === id);

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }

  updateCartBadge();
  alert(`✨ ${product.name} added to cart!`);
}

function updateCartBadge() {
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  document.getElementById('cartBadge').innerText = totalItems;
}

function openCartModal() {
  const modal = document.getElementById('cartModal');
  const cartItemsContainer = document.getElementById('cartItems');
  const totalContainer = document.getElementById('cartTotal');
  
  if (cart.length === 0) {
    cartItemsContainer.innerHTML = '<p style="text-align:center; color: #777; padding: 1rem 0;">Your cart is currently empty.</p>';
    totalContainer.innerText = '0';
  } else {
    let total = 0;
    cartItemsContainer.innerHTML = cart.map(item => {
      const itemTotal = item.price * item.qty;
      total += itemTotal;
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 0.6rem; padding-bottom: 0.5rem; border-bottom: 1px dotted #E5E7EB;">
          <div>
            <div style="font-weight:600; font-size:0.85rem;">${item.name}</div>
            <div style="font-size:0.75rem; color:#6B7280;">Qty: ${item.qty} × ₦${item.price.toLocaleString()}</div>
          </div>
          <div style="font-weight:700; color:#5C0A1B; font-size:0.9rem;">₦${itemTotal.toLocaleString()}</div>
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

// 6. CHECKOUT & N8N DISPATCH
document.getElementById('checkoutForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  if (cart.length === 0) {
    alert('Please add at least one item to your cart!');
    return;
  }

  const customerName = document.getElementById('custName').value;
  const customerPhone = document.getElementById('custPhone').value;
  const customerAddress = document.getElementById('custAddress').value;

  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const orderId = 'CJ-' + Math.floor(100000 + Math.random() * 900000);

  const payload = {
    orderId: orderId,
    timestamp: new Date().toISOString(),
    customer: {
      name: customerName,
      phone: customerPhone,
      address: customerAddress
    },
    items: cart,
    totalPrice: totalAmount,
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

    alert(`🎉 Thank you, ${customerName}!\n\nYour order #${orderId} has been submitted successfully.`);
    cart = [];
    updateCartBadge();
    closeCartModal();
    document.getElementById('checkoutForm').reset();

  } catch (err) {
    console.error('Webhook dispatch error:', err);
    alert('Order created locally!');
  }
});