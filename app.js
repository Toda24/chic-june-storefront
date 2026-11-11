// CONFIGURATION: Valerie's Live Paystack Key
const PAYSTACK_LIVE_KEY = 'pk_live_f0843f5e41a5cde7db5b1fb9d1d3373b4666fc8f';
const N8N_ORDER_WEBHOOK = 'http://localhost:5678/webhook/chic-june-order';
const N8N_PRODUCTS_WEBHOOK = 'http://localhost:5678/webhook/chic-june-products';

let products = [];
let cart = [];

// 1. Google Drive Image Link Auto-Formatter
function formatDriveUrl(url) {
  if (!url) return 'https://via.placeholder.com/300?text=Chic+June+Jewelry';
  const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://lh3.googleusercontent.com/d/${match[1]}`;
  }
  return url;
}

// 2. Dynamic Fetching from Google Sheets / n8n Webhook
async function fetchProducts() {
  try {
    const response = await fetch(N8N_PRODUCTS_WEBHOOK);
    const data = await response.json();
    products = Array.isArray(data) ? data : [];
    renderProducts(products);
  } catch (err) {
    console.warn("Using storefront sample cache:", err);
    products = [
      { id: 1, name: "Chic Layered Gold Anklet & Bracelet", price: 4000, category: "Anklets", image: "" },
      { id: 2, name: "Pave Cubic Zirconia Gold Band", price: 4000, category: "Rings", image: "" }
    ];
    renderProducts(products);
  }
}

// 3. Render Product Cards Grid
function renderProducts(items) {
  const grid = document.getElementById('productGrid');
  if (!grid) return;
  
  grid.innerHTML = items.map(item => `
    <div class="product-card">
      <div class="img-container">
        <img src="${formatDriveUrl(item.image)}" alt="${item.name}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="product-title">${item.name}</div>
        <div class="product-price">₦${Number(item.price).toLocaleString()}</div>
        <button class="add-to-bag-btn" onclick="addToCart(${item.id})">Add to Bag</button>
        
        <!-- Optional Star & Text Review Box -->
        <div class="review-section">
          <div class="star-rating">★★★★★</div>
          <textarea class="review-textarea" placeholder="Write an optional review..."></textarea>
        </div>
      </div>
    </div>
  `).join('');
}

// 4. Real-time Predictive Search & Dropdown Autocomplete
const searchInput = document.getElementById('searchInput');
const searchDropdown = document.getElementById('searchDropdown');

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    if (!query) {
      if (searchDropdown) searchDropdown.classList.remove('active');
      renderProducts(products);
      return;
    }

    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(query) || 
      (p.category && p.category.toLowerCase().includes(query))
    );

    renderProducts(filtered);

    // Show Autocomplete Suggestions Dropdown
    if (searchDropdown) {
      if (filtered.length > 0) {
        searchDropdown.innerHTML = filtered.map(p => `
          <div class="search-item-result" onclick="selectSearchItem('${p.name}')">
            <span>${p.name}</span>
            <small style="color:var(--chic-gold)">₦${Number(p.price).toLocaleString()}</small>
          </div>
        `).join('');
        searchDropdown.classList.add('active');
      } else {
        searchDropdown.classList.remove('active');
      }
    }
  });
}

function selectSearchItem(name) {
  if (searchInput) searchInput.value = name;
  if (searchDropdown) searchDropdown.classList.remove('active');
  const filtered = products.filter(p => p.name.toLowerCase() === name.toLowerCase());
  renderProducts(filtered);
}

// 5. Bag / Cart State
function addToCart(id) {
  const product = products.find(p => p.id === id);
  if (!product) return;
  
  const existing = cart.find(item => item.id === id);
  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ ...product, qty: 1 });
  }
  updateCartUI();
}

function updateCartUI() {
  const totalQty = cart.reduce((sum, item) => sum + item.qty, 0);
  const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  
  const cartCountEl = document.getElementById('cartCount');
  const cartTotalEl = document.getElementById('cartTotal');
  const cartItemsEl = document.getElementById('cartItems');

  if (cartCountEl) cartCountEl.innerText = totalQty;
  if (cartTotalEl) cartTotalEl.innerText = `₦${totalPrice.toLocaleString()}`;
  
  if (cartItemsEl) {
    cartItemsEl.innerHTML = cart.map(item => `
      <div class="cart-item">
        <div>
          <strong>${item.name}</strong><br>
          <small>₦${Number(item.price).toLocaleString()} x ${item.qty}</small>
        </div>
        <strong>₦${(item.price * item.qty).toLocaleString()}</strong>
      </div>
    `).join('');
  }
}

// 6. Paystack Live Inline Checkout Initialization
const checkoutBtn = document.getElementById('checkoutBtn');
if (checkoutBtn) {
  checkoutBtn.onclick = () => {
    const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    if (totalAmount === 0) return alert('Your bag is currently empty!');

    const customerEmail = prompt("Enter customer email for receipt & order logging:");
    if (!customerEmail) return;

    const handler = PaystackPop.setup({
      key: PAYSTACK_LIVE_KEY,
      email: customerEmail,
      amount: totalAmount * 100, // converted to kobo
      currency: 'NGN',
      ref: 'CJ_' + Math.floor((Math.random() * 1000000000) + 1),
      callback: function(response) {
        // Send order back to n8n Webhook for Google Sheets logging
        fetch(N8N_ORDER_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reference: response.reference,
            email: customerEmail,
            items: cart,
            total: totalAmount
          })
        }).catch(err => console.error("Webhook logging error:", err));

        alert('Payment successful! Reference: ' + response.reference);
        cart = [];
        updateCartUI();
        const drawer = document.getElementById('cartDrawer');
        if (drawer) drawer.classList.remove('open');
      },
      onClose: function() {
        alert('Payment canceled.');
      }
    });
    handler.openIframe();
  };
}

fetchProducts();