/**
 * Shopwave — Frontend Application
 * Vanilla JS, no build step required.
 */

// ─── Session ID (persisted so the server-side cart survives page refresh) ─────
function getSessionId() {
  let id = localStorage.getItem('sw_session');
  if (!id) {
    id = 'sess_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
    localStorage.setItem('sw_session', id);
  }
  return id;
}
const SESSION_ID = getSessionId();

// ─── State ────────────────────────────────────────────────────────────────────
let allProducts = [];
let cart = JSON.parse(localStorage.getItem('sw_cart') || '[]');
let activeCategory = 'all';
let searchQuery = '';

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const productGrid      = document.getElementById('product-grid');
const emptyState       = document.getElementById('empty-state');
const categoryFilters  = document.getElementById('category-filters');
const searchInput      = document.getElementById('search-input');
const cartToggle       = document.getElementById('cart-toggle');
const cartClose        = document.getElementById('cart-close');
const cartBackdrop     = document.getElementById('cart-backdrop');
const cartSidebar      = document.getElementById('cart-sidebar');
const cartItemsEl      = document.getElementById('cart-items');
const cartEmptyEl      = document.getElementById('cart-empty');
const cartFooterEl     = document.getElementById('cart-footer');
const cartCountEl      = document.getElementById('cart-count');
const cartSubtotalEl   = document.getElementById('cart-subtotal');
const cartTotalEl      = document.getElementById('cart-total');
const checkoutBtn      = document.getElementById('checkout-btn');
const checkoutModal    = document.getElementById('checkout-modal');
const checkoutBackdrop = document.getElementById('checkout-backdrop');
const modalClose       = document.getElementById('modal-close');
const modalOrderId     = document.getElementById('modal-order-id');
const toast            = document.getElementById('toast');
const toastMessage     = document.getElementById('toast-message');

// ─── Utility ──────────────────────────────────────────────────────────────────
function formatPrice(n) {
  return '$' + Number(n).toFixed(2);
}

function generateOrderId() {
  return 'ORD-' + Math.random().toString(36).toUpperCase().slice(2, 8);
}

// ─── Toast ────────────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  toastMessage.textContent = msg;
  toast.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-2');
  toast.classList.add('opacity-100');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    toast.classList.add('opacity-0', 'pointer-events-none');
    toast.classList.remove('opacity-100');
  }, 2800);
}

// ─── Cart persistence ─────────────────────────────────────────────────────────
function saveCart() {
  localStorage.setItem('sw_cart', JSON.stringify(cart));
}

// ─── Cart sidebar open / close ────────────────────────────────────────────────
function openCart() {
  cartSidebar.classList.remove('translate-x-full');
  cartBackdrop.classList.remove('hidden');
  requestAnimationFrame(() => cartBackdrop.classList.add('opacity-100'));
  document.body.style.overflow = 'hidden';
}

function closeCart() {
  cartSidebar.classList.add('translate-x-full');
  cartBackdrop.classList.remove('opacity-100');
  setTimeout(() => cartBackdrop.classList.add('hidden'), 300);
  document.body.style.overflow = '';
}

cartToggle.addEventListener('click', openCart);
cartClose.addEventListener('click', closeCart);
cartBackdrop.addEventListener('click', closeCart);

// ─── Render cart ──────────────────────────────────────────────────────────────
function renderCart() {
  cartItemsEl.innerHTML = '';

  if (cart.length === 0) {
    cartEmptyEl.classList.remove('hidden');
    cartEmptyEl.classList.add('flex');
    cartFooterEl.classList.add('hidden');
    cartItemsEl.classList.add('hidden');
    cartCountEl.classList.add('hidden');
    return;
  }

  cartEmptyEl.classList.add('hidden');
  cartEmptyEl.classList.remove('flex');
  cartFooterEl.classList.remove('hidden');
  cartItemsEl.classList.remove('hidden');

  let subtotal = 0;

  cart.forEach((item) => {
    subtotal += item.price * item.quantity;

    const el = document.createElement('div');
    el.className = 'flex gap-3 items-start group';
    el.innerHTML = `
      <img
        src="${item.image}"
        alt="${item.name}"
        class="h-16 w-16 rounded-xl object-cover flex-shrink-0 bg-gray-100"
        loading="lazy"
      />
      <div class="flex-1 min-w-0">
        <p class="text-sm font-semibold text-gray-800 truncate">${item.name}</p>
        <p class="text-xs text-gray-400 mt-0.5">${formatPrice(item.price)} each</p>
        <div class="flex items-center gap-2 mt-2">
          <button
            data-action="decrement"
            data-id="${item.productId}"
            class="qty-btn h-6 w-6 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm transition"
            aria-label="Decrease quantity"
          >−</button>
          <span class="text-sm font-medium w-5 text-center">${item.quantity}</span>
          <button
            data-action="increment"
            data-id="${item.productId}"
            class="qty-btn h-6 w-6 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-100 flex items-center justify-center text-sm transition"
            aria-label="Increase quantity"
          >+</button>
        </div>
      </div>
      <div class="flex flex-col items-end gap-1">
        <span class="text-sm font-bold text-gray-900">${formatPrice(item.price * item.quantity)}</span>
        <button
          data-action="remove"
          data-id="${item.productId}"
          class="remove-btn text-gray-300 hover:text-red-400 transition mt-1"
          aria-label="Remove item"
        >
          <svg class="h-4 w-4 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    `;
    cartItemsEl.appendChild(el);
  });

  cartSubtotalEl.textContent = formatPrice(subtotal);
  cartTotalEl.textContent = formatPrice(subtotal);

  // Badge
  const totalQty = cart.reduce((sum, i) => sum + i.quantity, 0);
  cartCountEl.textContent = totalQty;
  cartCountEl.classList.toggle('hidden', totalQty === 0);
}

// ─── Cart item interactions (event delegation) ────────────────────────────────
cartItemsEl.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-action]');
  if (!btn) return;

  const id = Number(btn.dataset.id);
  const action = btn.dataset.action;

  if (action === 'remove') {
    cart = cart.filter((i) => i.productId !== id);
  } else if (action === 'increment') {
    const item = cart.find((i) => i.productId === id);
    if (item) item.quantity += 1;
  } else if (action === 'decrement') {
    const item = cart.find((i) => i.productId === id);
    if (item) {
      item.quantity -= 1;
      if (item.quantity <= 0) cart = cart.filter((i) => i.productId !== id);
    }
  }

  saveCart();
  renderCart();
});

// ─── Add to cart ──────────────────────────────────────────────────────────────
function addToCart(productId) {
  const product = allProducts.find((p) => p.id === productId);
  if (!product) return;

  const existing = cart.find((i) => i.productId === productId);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      quantity: 1,
    });
  }

  saveCart();
  renderCart();
  showToast(`"${product.name}" added to cart`);

  // Animate the cart button
  cartToggle.classList.add('scale-110');
  setTimeout(() => cartToggle.classList.remove('scale-110'), 200);
}

// ─── Render products ──────────────────────────────────────────────────────────
function renderProducts(products) {
  // Remove skeleton cards
  productGrid.querySelectorAll('.skeleton-card').forEach((el) => el.remove());
  productGrid.innerHTML = '';

  if (products.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  products.forEach((product) => {
    const card = document.createElement('article');
    card.className =
      'bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col group';
    card.innerHTML = `
      <div class="relative overflow-hidden bg-gray-100 h-52">
        <img
          src="${product.image}"
          alt="${product.name}"
          class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />
        <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold text-brand px-2.5 py-1 rounded-full shadow-sm">
          ${product.category}
        </span>
      </div>
      <div class="p-4 flex flex-col flex-1">
        <h3 class="font-semibold text-gray-900 text-sm leading-snug mb-1 line-clamp-2">${product.name}</h3>
        <p class="text-xs text-gray-400 leading-relaxed flex-1 line-clamp-3 mb-3">${product.description}</p>
        <div class="flex items-center justify-between mt-auto">
          <span class="text-lg font-bold text-gray-900">${formatPrice(product.price)}</span>
          <button
            data-product-id="${product.id}"
            class="add-to-cart-btn bg-brand text-white text-xs font-semibold px-4 py-2 rounded-full hover:bg-brand-dark active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-brand"
          >
            Add to Cart
          </button>
        </div>
      </div>
    `;
    productGrid.appendChild(card);
  });
}

// ─── Filter & search ──────────────────────────────────────────────────────────
function getFilteredProducts() {
  return allProducts.filter((p) => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery) ||
      p.description.toLowerCase().includes(searchQuery) ||
      p.category.toLowerCase().includes(searchQuery);
    return matchesCategory && matchesSearch;
  });
}

function applyFilters() {
  renderProducts(getFilteredProducts());
}

// ─── Category buttons ─────────────────────────────────────────────────────────
function buildCategoryFilters(products) {
  const categories = ['all', ...new Set(products.map((p) => p.category))];
  categoryFilters.innerHTML = '';

  categories.forEach((cat) => {
    const btn = document.createElement('button');
    btn.dataset.category = cat;
    btn.textContent = cat === 'all' ? 'All' : cat;
    btn.className =
      'category-btn px-4 py-1.5 rounded-full text-sm font-medium border transition ' +
      (cat === activeCategory
        ? 'bg-brand text-white border-brand'
        : 'bg-white text-gray-600 border-gray-200 hover:border-brand hover:text-brand');
    categoryFilters.appendChild(btn);
  });
}

categoryFilters.addEventListener('click', (e) => {
  const btn = e.target.closest('[data-category]');
  if (!btn) return;
  activeCategory = btn.dataset.category;

  categoryFilters.querySelectorAll('.category-btn').forEach((b) => {
    const isActive = b.dataset.category === activeCategory;
    b.className =
      'category-btn px-4 py-1.5 rounded-full text-sm font-medium border transition ' +
      (isActive
        ? 'bg-brand text-white border-brand'
        : 'bg-white text-gray-600 border-gray-200 hover:border-brand hover:text-brand');
  });

  applyFilters();
});

// ─── Search ───────────────────────────────────────────────────────────────────
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    searchQuery = e.target.value.trim().toLowerCase();
    applyFilters();
  });
}

// ─── Product grid click (event delegation) ────────────────────────────────────
productGrid.addEventListener('click', (e) => {
  const btn = e.target.closest('.add-to-cart-btn');
  if (!btn) return;
  const id = Number(btn.dataset.productId);
  addToCart(id);
});

// ─── Checkout ─────────────────────────────────────────────────────────────────
checkoutBtn.addEventListener('click', () => {
  if (cart.length === 0) return;

  // Simulate order placement
  const orderId = generateOrderId();
  modalOrderId.textContent = 'Order ID: ' + orderId;

  closeCart();
  checkoutModal.classList.remove('hidden');

  // Clear cart after "order"
  cart = [];
  saveCart();
  renderCart();
});

function closeCheckoutModal() {
  checkoutModal.classList.add('hidden');
}

modalClose.addEventListener('click', closeCheckoutModal);
checkoutBackdrop.addEventListener('click', closeCheckoutModal);

// Close modal on Escape
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeCart();
    closeCheckoutModal();
  }
});

// ─── Fetch products from API ──────────────────────────────────────────────────
async function loadProducts() {
  try {
    const res = await fetch('/api/products');
    if (!res.ok) throw new Error('Failed to fetch products');
    allProducts = await res.json();
    buildCategoryFilters(allProducts);
    renderProducts(allProducts);
  } catch (err) {
    console.error('Error loading products:', err);
    productGrid.querySelectorAll('.skeleton-card').forEach((el) => el.remove());
    productGrid.innerHTML = `
      <div class="col-span-full text-center py-16 text-gray-400">
        <p class="text-lg font-medium">Failed to load products</p>
        <p class="text-sm mt-1">Please refresh the page and try again.</p>
      </div>
    `;
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────
loadProducts();
renderCart();
