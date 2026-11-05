/**
 * CHIC JUNE - Professional E-Commerce Engine with Valerie's Real Media & Scroll Motion
 */

const N8N_ORDER_WEBHOOK_URL = 'https://kaila-ungotten-wade.ngrok-free.dev/webhook/chic-june-order';
const N8N_PRODUCTS_URL = 'https://kaila-ungotten-wade.ngrok-free.dev/webhook/chic-june-products';
const PAYSTACK_PUBLIC_KEY = 'pk_test_1234567890abcdef1234567890abcdef12345678';

// Valerie's Actual Inventory & Media Mapping (Starting at her ₦4,000 baseline)
let products = [
  { 
    id: 1, 
    name: 'Milan Shijia Gold Sculpted Drop Earrings', 
    price: 4000, 
    tag: 'NEW COLLECTION', 
    mediaType: 'image', 
    img: 'pic3.jpeg',
    desc: 'S925 Post luxury gold sculpted fluid drop earrings featuring stunning polished curves.' 
  },
  { 
    id: 2, 
    name: 'Uglyver Gold Ruffled Petal Earrings', 
    price: 4000, 
    tag: 'BESTSELLER', 
    mediaType: 'image', 
    img: 'pic4.jpeg',
    desc: 'Exquisite gold-plated ruffled petal hoop earrings with secure S925 post backing.' 
  },
  { 
    id: 3, 
    name: 'Sculpted Golden Wave Set (Reel)', 
    price: 4500, 
    tag: 'TRENDING', 
    mediaType: 'video', 
    img: 'GIF1.mp4',
    desc: 'Signature gold statement piece captured live in studio.' 
  },
  { 
    id: 4, 
    name: 'Royal Heritage Gold Chain & Pendant', 
    price: 5000, 
    tag: 'POPULAR', 
    mediaType: 'video', 
    img: 'GIF2.mp4',
    desc: 'Tarnish-resistant gold chain designed for everyday elegance.' 
  },
  { 
    id: 5, 
    name: 'Chic Layered Gold Anklet & Bracelet Set', 
    price: 4000, 
    tag: 'NEW', 
    mediaType: 'video', 
    img: 'GIF3.mp4',
    desc: 'Delicate stacked gold accents for effortless charm.' 
  },
  { 
    id: 6, 
    name: 'Pave Cubic Zirconia Gold Band', 
    price: 4000, 
    tag: 'LIMITED', 
    mediaType: 'video', 
    img: 'GIF4.mp4',
    desc: 'Shimmering pavé set gold band ring.' 
  }
];

let cart = [];
let activeQvProduct = null;
let activeQvQty = 1;
let currentShippingFee = 2000;

document.addEventListener('DOMContentLoaded', async () => {
  await fetchLiveProducts();
  initSlideshow();
  loadSavedCustomerAccount();
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
    console.warn('Using local inventory fallback:', err);
  } finally {
    renderGrids();
  }
}

function switchTab(tabName) {
  document.querySelectorAll('.page-view').forEach(view => view.classList.remove('active'));
  document.querySelectorAll('.nav-tab').forEach(tab => tab.classList.remove('active'));

  const targetPage = document.getElementById(`page-${tabName}`);
  if (targetPage) targetPage.classList.add('active');

  const activeBtn = Array.from(document.querySelectorAll('.nav-tab')).find(btn => 
    btn.getAttribute('onclick').includes(tabName)
  );
  if (activeBtn) activeBtn.classList.add('active');

  window.scrollTo({ top: 0, behavior: 'smooth' });

  if (tabName === 'care') {
    resetAndTriggerCareMotion();
  }
  if (tabName === 'catalog') {
    resetAndTriggerCatalogMotion();
  }
}

function resetAndTriggerCareMotion() {
  const reveals = document.querySelectorAll('#page-care .reveal-stagger');
  reveals.forEach(el => el.classList.remove('active'));

  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('active');
          }, index * 150);
        }
      });
    }, { threshold: 0.05 });

    reveals.forEach(el => observer.observe(el));
  }, 150);
}

function resetAndTriggerCatalogMotion() {
  const reveals = document.querySelectorAll('#fullProductGrid .reveal-stagger');
  reveals.forEach(el => el.classList.remove('active'));

  setTimeout(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('active');
          }, index * 120);
        }
      });
    }, { threshold: 0.05 });

    reveals.forEach(el => observer.observe(el));
  }, 150);
}

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

function renderGrids() {
  const fullGrid = document.getElementById('fullProductGrid');

  const cardHTML = (p) => `
    <div class="product-card reveal-stagger" onclick="openProductModal(${p.id})">
      <div class="card-media">
        ${p.mediaType === 'video' 
          ? `<video src="${p.img || p.mediaUrl}" autoplay muted loop playsinline style="width:100%; height:100%; object-fit:cover;"></video>`
          : `<img src="${p.img || p.mediaUrl}" alt="${p.name}" />`}
        <span class="card-tag">${p.tag || 'NEW'}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${p.name}</h3>
        <div class="card-rating-stars">⭐⭐⭐⭐⭐ (5.0)</div>
        <div class="card-price">₦${Number(p.price).toLocaleString()}</div>
        <div class="card-actions">
          <button class="btn-card-add" onclick="event.stopPropagation(); addToCart(${p.id})">Add to Bag</button>
        </div>
      </div>
    </div>
  `;

  if (fullGrid) {
    fullGrid.innerHTML = products.map(cardHTML).join('');
    resetAndTriggerCatalogMotion();
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

  const mediaBox = document.getElementById('qvMedia');
  mediaBox.innerHTML = product.mediaType === 'video'
    ? `<video src="${product.img || product.mediaUrl}" autoplay muted loop playsinline></video>`
    : `<img src="${product.img || product.mediaUrl}" alt="${product.name}" />`;

  const pageUrl = encodeURIComponent(window.location.href);
  const shareText = encodeURIComponent(`Check out ${product.name} on Chic June! ✨`);
  document.getElementById('shareWa').href = `https://wa.me/?text=${shareText}%20${pageUrl}`;
  document.getElementById('shareX').href = `https://twitter.com/intent/tweet?text=${shareText}&url=${pageUrl}`;

  document.getElementById('productModal').style.display = 'flex';
}

function closeProductModal() {
  document.getElementById('productModal').style.display = 'none';
}

function adjustQvQty(delta) {
  activeQvQty = Math.max(1, activeQvQty + delta);
  document.getElementById('qvQtyVal').innerText = activeQvQty;
}

function addQvToBag() {
  if (!activeQvProduct) return;
  
  const existing = cart.find(item => item.id === activeQvProduct.id);
  if (existing) {
    existing.qty += activeQvQty;
  } else {
    cart.push({ ...activeQvProduct, qty: activeQvQty });
  }

  updateCartBadge();
  closeProductModal();
  alert(`✨ ${activeQvQty}x ${activeQvProduct.name} added to your bag!`);
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

function updateShippingRate() {
  const state = document.getElementById('custState').value;
  currentShippingFee = state === 'Lagos' ? 2000 : 4500;
  document.getElementById('shippingFee').innerText = currentShippingFee.toLocaleString();
  recalculateCartTotals();
}

function recalculateCartTotals() {
  let subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  let total = subtotal + (cart.length > 0 ? currentShippingFee : 0);

  document.getElementById('cartSubtotal').innerText = subtotal.toLocaleString();
  document.getElementById('cartTotal').innerText = total.toLocaleString();
}

function openCartModal() {
  const modal = document.getElementById('cartModal');
  const listContainer = document.getElementById('cartItemsList');

  if (cart.length === 0) {
    listContainer.innerHTML = '<p style="text-align:center; color:#777; padding: 1rem 0;">Your shopping bag is empty.</p>';
  } else {
    listContainer.innerHTML = cart.map(item => {
      const itemTotal = item.price * item.qty;
      return `
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.6rem; padding-bottom:0.5rem; border-bottom:1px dotted #ccc;">
          <div>
            <div style="font-weight:600; font-size:0.82rem;">${item.name}</div>
            <div style="font-size:0.72rem; color:#666;">Qty: ${item.qty} × ₦${item.price.toLocaleString()}</div>
          </div>
          <div style="font-weight:700; color:#5C0A1B; font-size:0.85rem;">₦${itemTotal.toLocaleString()}</div>
        </div>
      `;
    }).join('');
  }

  recalculateCartTotals();
  modal.style.display = 'flex';
}

function closeCartModal() {
  document.getElementById('cartModal').style.display = 'none';
}

document.getElementById('checkoutForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  if (cart.length === 0) {
    alert('Please add at least one item to your bag!');
    return;
  }

  const firstName = document.getElementById('custFirstName').value;
  const lastName = document.getElementById('custLastName').value;
  const email = document.getElementById('custEmail').value;
  const phone = document.getElementById('custPhone').value;
  const address = document.getElementById('custAddress').value;
  const state = document.getElementById('custState').value;
  const city = document.getElementById('custCity').value;
  const note = document.getElementById('custNote').value;

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const totalAmount = subtotal + currentShippingFee;
  const orderId = 'CJ-' + Math.floor(100000 + Math.random() * 900000);

  const handler = PaystackPop.setup({
    key: PAYSTACK_PUBLIC_KEY,
    email: email,
    amount: totalAmount * 100,
    currency: 'NGN',
    ref: orderId,
    metadata: {
      custom_fields: [
        { display_name: "Customer Name", variable_name: "customer_name", value: `${firstName} ${lastName}` },
        { display_name: "Phone Number", variable_name: "phone_number", value: phone },
        { display_name: "Delivery Address", variable_name: "delivery_address", value: `${address}, ${city}, ${state}` },
        { display_name: "Merchant Note", variable_name: "merchant_note", value: note }
      ]
    },
    callback: function(response) {
      const payload = {
        orderId,
        paymentReference: response.reference,
        timestamp: new Date().toISOString(),
        customer: { firstName, lastName, email, phone, address, state, city, note },
        items: cart,
        subtotal,
        shippingFee: currentShippingFee,
        totalPrice: totalAmount,
        status: 'PAID'
      };

      if (N8N_ORDER_WEBHOOK_URL) {
        fetch(N8N_ORDER_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.error('n8n post error:', err));
      }

      alert(`🎉 Payment Successful!\n\nReference: ${response.reference}\nThank you, ${firstName}! Valerie will prepare your order.`);
      cart = [];
      updateCartBadge();
      closeCartModal();
      document.getElementById('checkoutForm').reset();
    },
    onClose: function() {
      alert('Payment window closed.');
    }
  });

  handler.openIframe();
});

function openAccountModal() {
  document.getElementById('accountModal').style.display = 'flex';
}

function closeAccountModal() {
  document.getElementById('accountModal').style.display = 'none';
}

document.getElementById('accountForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const accountData = {
    firstName: document.getElementById('accFirstName').value,
    lastName: document.getElementById('accLastName').value,
    email: document.getElementById('accEmail').value,
    phone: document.getElementById('accPhone').value,
    address: document.getElementById('accAddress').value
  };

  localStorage.setItem('cj_customer_account', JSON.stringify(accountData));
  loadSavedCustomerAccount();
  closeAccountModal();
  alert(`✨ Welcome back, ${accountData.firstName}! Your details are saved for fast checkout.`);
});

function loadSavedCustomerAccount() {
  const saved = localStorage.getItem('cj_customer_account');
  if (!saved) return;

  const data = JSON.parse(saved);
  
  document.getElementById('custFirstName').value = data.firstName || '';
  document.getElementById('custLastName').value = data.lastName || '';
  document.getElementById('custEmail').value = data.email || '';
  document.getElementById('custPhone').value = data.phone || '';
  document.getElementById('custAddress').value = data.address || '';

  document.getElementById('accFirstName').value = data.firstName || '';
  document.getElementById('accLastName').value = data.lastName || '';
  document.getElementById('accEmail').value = data.email || '';
  document.getElementById('accPhone').value = data.phone || '';
  document.getElementById('accAddress').value = data.address || '';

  document.getElementById('accountBtnText').innerText = `👤 ${data.firstName}`;
}