/* ============================================================
   LUEUR BEAUTY — script.js
   ============================================================ */

/* ===== HELPERS ===== */
function roundPrice(val) { return Math.round(parseFloat(val || 0) * 100) / 100; }
function formatPrice(val) { return roundPrice(val).toFixed(2); }

async function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/* ===== GLOBAL STORE SETTINGS ===== */
window.storeSettings = {
  storeName: "Lueur Beauty",
  storeEmail: "hello@lueurbeauty.com",
  storePhone: "+1 (800) 583-7829",
  storeAddress: "123 Rose Lane, Beverly Hills, CA 90210",
  currency: "USD",
  shippingCost: 5.99,
  freeShippingThreshold: 50,
  promoCodes: []
};

/*=====CLOUDINARY====*/
const CLOUDINARY_CLOUD_NAME = "dgsuollyy";
const CLOUDINARY_UPLOAD_PRESET = "lueur_products";

/* Upload Function( cloudinary)*/
async function uploadToCloudinary(file) {
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || "Upload failed");
  }

  return data.secure_url;
}


/* ===== PRODUCTS DATABASE ===== */
const PRODUCTS = [
  { id: 1, name: "Rose Glow Serum", category: "Serums", price: 48.00, oldPrice: 62.00, emoji: "🌹", image: "images/product_serum.png", desc: "Hydrating rose-infused serum for a luminous, dewy complexion.", stock: 24, featured: true },
  { id: 2, name: "Velvet Moisture Cream", category: "Moisturizers", price: 36.00, oldPrice: null, emoji: "🫧", image: "images/product_cream.png", desc: "Rich, non-greasy formula that absorbs instantly for all-day hydration.", stock: 18, featured: true },
  { id: 3, name: "Glossy Petal Lip Set", category: "Lip Care", price: 22.00, oldPrice: 28.00, emoji: "💋", image: "images/product_lipgloss.png", desc: "Three-piece lip gloss set in nude and berry tones. Long-lasting wear.", stock: 42, featured: true },
  { id: 4, name: "Vitamin C Brightening Toner", category: "Toners", price: 31.00, oldPrice: 38.00, emoji: "🍊", image: "images/product_toner.png", desc: "Pore-refining toner with vitamin C and hyaluronic acid.", stock: 30, featured: true },
  { id: 5, name: "Pink Clay Glow Mask", category: "Masks", price: 27.00, oldPrice: null, emoji: "🌸", image: "images/product_mask.png", desc: "Deep-cleansing pink clay mask with rose and kaolin for refined pores.", stock: 15 },
  { id: 6, name: "Hydra-Boost Eye Cream", category: "Eye Care", price: 42.00, oldPrice: 55.00, emoji: "✨", image: "images/Hydra-Boost eye cream with flowers.png", desc: "Reduce dark circles and puffiness with caffeine and peptide complex.", stock: 9 },
  { id: 7, name: "Satin Glow Face Oil", category: "Oils", price: 54.00, oldPrice: null, emoji: "💧", image: "images/satin Glow face oil with roses.png", desc: "Lightweight rosehip and jojoba oil blend for a silky, natural glow.", stock: 20 },
  { id: 8, name: "Rosewater Mist Spray", category: "Toners", price: 18.00, oldPrice: 24.00, emoji: "🌺", image: "images/Rosewater mist with pink roses.png", desc: "Refreshing rosewater facial mist for hydration throughout the day.", stock: 55 },
];

// Sync hardcoded products with dashboard edits so stock updates apply immediately across pages
try {
  const dashSaved = JSON.parse(localStorage.getItem('lueur_dash_products'));
  if (dashSaved && Array.isArray(dashSaved)) {
    PRODUCTS.forEach(p => {
      const updated = dashSaved.find(d => String(d.id) === String(p.id));
      if (updated) {
        p.stock = updated.stock;
        p.price = updated.price;
        p.name = updated.name;
        p.desc = updated.desc;
        p.category = updated.category;
      }
    });
  }
} catch(e) {}

/* ===== CART (persisted in localStorage) ===== */
let cart = JSON.parse(localStorage.getItem('lueur_cart') || '[]');
let appliedPromoCode = localStorage.getItem('lueur_promo') || null;

function saveCart() { localStorage.setItem('lueur_cart', JSON.stringify(cart)); }

function getCartCount() { return cart.reduce((s, i) => s + i.qty, 0); }

function getCartTotal() { return roundPrice(cart.reduce((s, i) => s + i.price * i.qty, 0)); }

function addToCart(productId) {
  let p = PRODUCTS.find(x => String(x.id) === String(productId));
  if (!p && window.__productsCache) {
    p = window.__productsCache.find(x => String(x.id) === String(productId));
  }
  if (!p) return;

  const stock = typeof p.stock !== 'undefined' ? parseInt(p.stock) : 10;
  if (stock <= 0) {
    showToast('Out of Stock', 'error');
    return;
  }

  const existing = cart.find(x => String(x.id) === String(productId));
  const maxQty = Math.min(stock, 5); // Max 5 items per product
  if (existing) {
    if (existing.qty >= maxQty) {
      showToast(stock < 5 ? 'Maximum available stock reached' : 'Maximum 5 per item allowed', 'error');
      return;
    }
    existing.qty++;
  } else {
    cart.push({ id: p.id, name: p.name, price: p.price, image: p.image, emoji: p.emoji, qty: 1 });
  }

  saveCart();
  updateCartBadges();
  showToast(`${p.name} added to cart`, 'success');
}

function removeFromCart(productId) {
  cart = cart.filter(x => String(x.id) !== String(productId));
  saveCart();
  updateCartBadges();
  renderCartPage();
}

/* ===== WISHLIST (persisted in localStorage) ===== */
let wishlist = JSON.parse(localStorage.getItem('lueur_wishlist') || '[]');

function saveWishlist() { localStorage.setItem('lueur_wishlist', JSON.stringify(wishlist)); }

function getWishlistCount() { return wishlist.length; }

function addToWishlist(productId) {
  const existing = wishlist.find(x => String(x.id) === String(productId));
  if (existing) {
    showToast('Already in wishlist', 'info');
    return;
  }
  let p = PRODUCTS.find(x => String(x.id) === String(productId));
  if (!p && window.__productsCache) {
    p = window.__productsCache.find(x => String(x.id) === String(productId));
  }
  if (!p) return;

  wishlist.push({ id: p.id, name: p.name, price: p.price, image: p.image, emoji: p.emoji, category: p.category, stock: p.stock });
  saveWishlist();
  updateWishlistBadges();
  showToast(`${p.name} added to wishlist`, 'success');
}

function removeFromWishlist(productId) {
  wishlist = wishlist.filter(x => String(x.id) !== String(productId));
  saveWishlist();
  updateWishlistBadges();
  if (typeof initWishlistPage === 'function' && window.location.pathname.includes('wishlist.html')) {
    initWishlistPage();
  }
}

function moveToCartFromWishlist(productId) {
  let p = wishlist.find(x => String(x.id) === String(productId));
  if (!p) return;
  const stock = typeof p.stock !== 'undefined' ? parseInt(p.stock) : 10;
  if (stock <= 0) {
    showToast('Out of Stock', 'error');
    return;
  }
  const existingInCart = cart.find(x => String(x.id) === String(productId));
  if (existingInCart && existingInCart.qty >= stock) {
    showToast('Maximum available stock reached', 'error');
    return;
  }
  addToCart(productId);
  removeFromWishlist(productId);
}

function updateWishlistBadges() {
  document.querySelectorAll('.wishlist-badge').forEach(b => { b.textContent = getWishlistCount(); });
}

function updateQty(productId, delta) {
  const item = cart.find(x => String(x.id) === String(productId));
  if (!item) return;

  let p = PRODUCTS.find(x => String(x.id) === String(productId));
  if (!p && window.__productsCache) {
    p = window.__productsCache.find(x => String(x.id) === String(productId));
  }
  const stock = p && typeof p.stock !== 'undefined' ? parseInt(p.stock) : 10;

  const maxQty = Math.min(stock, 5);
  if (delta > 0 && item.qty >= maxQty) {
    showToast(stock < 5 ? 'Maximum available stock reached' : 'Maximum 5 per item allowed', 'error');
    return;
  }

  item.qty = Math.max(1, item.qty + delta);
  saveCart();
  renderCartPage();
  updateCartBadges();
}

function updateCartBadges() {
  document.querySelectorAll('.cart-badge').forEach(b => { b.textContent = getCartCount(); });
}

/* ===== TOAST ===== */
function showToast(msg, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.innerHTML = `<span class="toast-icon">${icons[type] || 'ℹ️'}</span><span>${msg}</span>`;
  container.appendChild(t);
  setTimeout(() => { t.style.animation = 'slideInRight .3s ease reverse'; setTimeout(() => t.remove(), 300); }, 3000);
}

/* ===== NAVBAR ===== */
function initNavbar() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 20);
  });
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');
  if (hamburger) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      hamburger.classList.toggle('open');
    });
    // Close menu when link clicked
    navLinks?.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
      });
    });
  }
  updateCartBadges();
  updateWishlistBadges();
  // highlight active link
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === path || (path === 'index.html' && href === 'index.html')) a.classList.add('active');
  });
}

/* ===== AUTH STATE (NAVBAR) ===== */
function initAuthState() {
  // Guard: firebase.js may not be loaded on every page
  if (typeof window.firebaseOnAuthStateChanged !== 'function') return;

  const loginLink = document.getElementById('nav-login-link');
  const profile = document.getElementById('nav-profile');
  const emailEl = document.getElementById('nav-profile-email');
  const profileBtn = document.getElementById('nav-profile-btn');
  const dropdown = document.getElementById('nav-profile-dropdown');
  const logoutBtn = document.getElementById('nav-logout-btn');

  // Listen for auth state
  window.firebaseOnAuthStateChanged(user => {
    if (user) {
      // ── Logged IN ──
      if (loginLink) loginLink.style.display = 'none';
      if (profile) profile.style.display = 'flex';
      if (emailEl) emailEl.textContent = user.email;
    } else {
      // ── Logged OUT ──
      if (loginLink) loginLink.style.display = '';
      if (profile) profile.style.display = 'none';
      if (dropdown) dropdown.classList.remove('open');
    }
  });

  // Toggle dropdown on profile button click
  profileBtn?.addEventListener('click', e => {
    e.stopPropagation();
    dropdown?.classList.toggle('open');
  });

  // Sign out
  logoutBtn?.addEventListener('click', async () => {
    try {
      await window.firebaseSignOut();
      showToast('Signed out successfully', 'success');
    } catch (err) {
      showToast('Sign out failed. Please try again.', 'error');
    }
  });

  // Close dropdown when clicking anywhere outside
  document.addEventListener('click', e => {
    if (!e.target.closest('#nav-profile')) {
      dropdown?.classList.remove('open');
    }
  });
}

/* ===== PRODUCT CARD HTML ===== */
function productCardHTML(p, showAddCart = true) {
  const price = parseFloat(p.price) || 0;
  const oldPrice = p.oldPrice ? parseFloat(p.oldPrice) : null;
  const emoji = p.emoji || '🌸';
  const desc = p.desc || '';

  const stock = typeof p.stock !== 'undefined' ? parseInt(p.stock) : 10;
  const isOutOfStock = stock <= 0;

  const imgInner = (p.image && typeof p.image === 'string' && p.image.trim() !== '')
    ? `<img src="${p.image}" alt="${p.name}" class="product-img" loading="lazy" onerror="this.onerror=null; this.outerHTML='<div class=\\'product-img-placeholder\\'>${emoji}</div>';">`
    : `<div class="product-img-placeholder">${emoji}</div>`;
  const mrpVal = p.mrp || oldPrice;
  const oldPriceHTML = mrpVal ? `<span class="old-price">$${formatPrice(mrpVal)}</span>` : '';
  let badgeHTML = '';
  if (p.discount) badgeHTML = `<span class="product-badge">${p.discount}% OFF</span>`;
  else if (mrpVal) badgeHTML = `<span class="product-badge">Sale</span>`;
  else if (isOutOfStock) badgeHTML = `<span class="product-badge" style="background:var(--text-light);color:#fff;">Out of Stock</span>`;

  let addBtnHTML = '';
  if (showAddCart) {
    if (isOutOfStock) {
      addBtnHTML = `<button class="add-to-cart" disabled style="opacity:0.5;cursor:not-allowed;">Out of Stock</button>`;
    } else {
      addBtnHTML = `<button class="add-to-cart" onclick="addToCart('${p.id}')">+ Add to Cart</button>`;
    }
  }

  const inWishlist = typeof wishlist !== 'undefined' && wishlist.find(x => String(x.id) === String(p.id));
  const heartStr = inWishlist ? '♥' : '♡';
  const heartColor = inWishlist ? 'color:var(--rose);' : '';

  return `
    <div class="product-card" id="product-${p.id}">
      <div class="product-img-wrap">
        <a href="product.html?id=${p.id}" style="display:block; height:100%; text-decoration:none;">
          ${badgeHTML}
          ${imgInner}
        </a>
        <button class="product-wishlist" title="Wishlist" style="${heartColor}" onclick="event.preventDefault(); event.stopPropagation(); addToWishlist('${p.id}'); this.textContent = '♥'; this.style.color = 'var(--rose)';">${heartStr}</button>
      </div>
      <div class="product-info">
        <div class="product-category">${p.category}</div>
        <a href="product.html?id=${p.id}" style="text-decoration:none; color:inherit;">
          <div class="product-name">${p.name}</div>
        </a>
        <div class="product-desc">${desc}</div>
        <div class="product-footer">
          <div class="product-price">${oldPriceHTML}$${formatPrice(price)}</div>
          ${addBtnHTML}
        </div>
      </div>
    </div>`;
}

/* ===== HOME PAGE ===== */
async function initHomePage() {
  const featuredGrid = document.getElementById('featured-grid');
  const allGrid = document.getElementById('all-products-grid');

  let firestoreProducts = [];
  if (typeof window.firestoreGetDocs === 'function') {
    try {
      const snapshot = await window.firestoreGetDocs('products');
      if (!snapshot.empty) {
        snapshot.forEach(docSnap => {
          firestoreProducts.push({ id: docSnap.id, ...docSnap.data() });
        });
        // Cache products globally so addToCart can find them on the homepage
        window.__productsCache = window.__productsCache ? [...window.__productsCache, ...firestoreProducts] : firestoreProducts;
      }
    } catch (err) {
      console.warn('Firestore products load failed on homepage:', err);
    }
  }

  // Filter out duplicates by name against hardcoded PRODUCTS
  const existingNames = new Set(PRODUCTS.map(p => p.name.toLowerCase().trim()));
  const newProducts = firestoreProducts.filter(p => {
    const name = p.name ? p.name.toLowerCase().trim() : '';
    return name && !existingNames.has(name);
  });

  // Featured products
  if (featuredGrid) {
    const hardcodedFeatured = PRODUCTS.filter(p => p.featured);
    const combinedFeatured = [...hardcodedFeatured, ...newProducts];
    featuredGrid.innerHTML = combinedFeatured.map(p => productCardHTML(p)).join('');
  }

  // All products grid
  if (allGrid) {
    const combinedAll = [...PRODUCTS, ...newProducts];
    allGrid.innerHTML = combinedAll.map(p => productCardHTML(p)).join('');
  }

  // Wishlist toggle
  document.querySelectorAll('.product-wishlist').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.textContent = btn.textContent.trim() === '♡' ? '♥' : '♡';
      btn.style.color = btn.textContent.trim() === '♥' ? 'var(--rose)' : '';
    });
  });

  // Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      const combinedAll = [...PRODUCTS, ...newProducts];
      const filtered = cat === 'all' ? combinedAll : combinedAll.filter(p => p.category === cat);
      if (allGrid) {
        allGrid.innerHTML = filtered.map(p => productCardHTML(p)).join('');
        document.querySelectorAll('.product-wishlist').forEach(b => {
          b.addEventListener('click', () => { b.textContent = b.textContent === '🤍' ? '❤️' : '🤍'; });
        });
      }
    });
  });

  // Animate on scroll
  initScrollAnimations();
  initReviewsCarousel();
}

/* ===== REVIEWS CAROUSEL ===== */
function initReviewsCarousel() {
  const carousel = document.getElementById('reviews-carousel');
  const track = document.getElementById('reviews-track');
  if (!carousel || !track) return;
  const cards = track.querySelectorAll('.review-card');
  const dots = document.querySelectorAll('.dot');
  if (cards.length === 0) return;

  let currentIndex = 0;

  function updateTransform() {
    const cardWidth = cards[0].offsetWidth;
    // 20px is the gap defined in CSS
    track.style.transform = `translateX(calc(-${currentIndex} * (${cardWidth}px + 20px)))`;
  }

  function goTo(index) {
    cards[currentIndex].classList.remove('active');
    dots[currentIndex]?.classList.remove('active');
    currentIndex = index;
    cards[currentIndex].classList.add('active');
    dots[currentIndex]?.classList.add('active');
    updateTransform();
  }

  dots.forEach((dot, i) => dot.addEventListener('click', () => {
    goTo(i);
    resetTimer();
  }));

  let timer;
  function startTimer() {
    timer = setInterval(() => {
      goTo((currentIndex + 1) % cards.length);
    }, 5000);
  }

  function resetTimer() {
    clearInterval(timer);
    startTimer();
  }

  startTimer();

  window.addEventListener('resize', updateTransform);

  // Pause on hover
  carousel.addEventListener('mouseenter', () => clearInterval(timer));
  carousel.addEventListener('mouseleave', () => startTimer());
}

/* ===== PRODUCTS PAGE ===== */
async function initProductsPage() {
  const grid = document.getElementById('products-page-grid');
  if (!grid) return;

  // Show skeleton loading state
  grid.innerHTML = Array.from({ length: 4 }, () => `
    <div class="skeleton-card">
      <div class="skeleton-img"></div>
      <div class="skeleton-line medium"></div>
      <div class="skeleton-line short"></div>
      <div class="skeleton-line medium"></div>
    </div>`).join('');

  // Load products from Firestore
  let firestoreProducts = [];

  if (typeof window.firestoreGetDocs === 'function') {
    try {
      const snapshot = await window.firestoreGetDocs('products');
      if (!snapshot.empty) {
        snapshot.forEach(docSnap => {
          firestoreProducts.push({ id: docSnap.id, ...docSnap.data() });
        });

        // Filter out duplicates by name against hardcoded PRODUCTS
        const existingNames = new Set(PRODUCTS.map(p => p.name.toLowerCase().trim()));
        firestoreProducts = firestoreProducts.filter(p => {
          const name = p.name ? p.name.toLowerCase().trim() : '';
          return name && !existingNames.has(name);
        });
      }
    } catch (err) {
      console.warn('Firestore products load failed:', err);
    }
  }

  const allProducts = [...PRODUCTS, ...firestoreProducts];
  window.__productsCache = allProducts;
  let currentProducts = [...allProducts];

  const render = () => {
    if (currentProducts.length === 0) {
      grid.innerHTML = `
        <div style="text-align:center;padding:80px 20px;grid-column:1/-1;">
          <div style="font-size:3rem;margin-bottom:16px;">🌸</div>
          <h3 style="font-family:var(--font-heading);font-size:1.5rem;margin-bottom:8px;color:var(--text-primary);">No products yet</h3>
          <p style="color:var(--text-muted);font-size:.9rem;">Check back soon — new arrivals are on the way!</p>
        </div>`;
      return;
    }
    grid.innerHTML = currentProducts.map(p => productCardHTML(p)).join('');
    initWishlistBtns();
  };

  render();

  // Search
  const searchInput = document.getElementById('product-search');
  if (searchInput) {
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      currentProducts = allProducts.filter(p =>
        (p.name || '').toLowerCase().includes(q) || (p.category || '').toLowerCase().includes(q)
      );
      render();
    });
  }

  // Filters
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.filter;
      currentProducts = cat === 'all' ? [...allProducts] : allProducts.filter(p => p.category === cat);
      render();
    });
  });
}

function initWishlistBtns() {
  document.querySelectorAll('.product-wishlist').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.textContent = btn.textContent.trim() === '♡' ? '♥' : '♡';
      btn.style.color = btn.textContent.trim() === '♥' ? 'var(--rose)' : '';
    });
  });
}

/* ===== CART PAGE ===== */
function renderCartPage() {
  const container = document.getElementById('cart-items-container');
  const summaryEl = document.getElementById('cart-summary-box');
  const emptyEl = document.getElementById('cart-empty');
  if (!container) return;

  if (cart.length === 0) {
    container.innerHTML = '';
    if (summaryEl) summaryEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';
  if (summaryEl) summaryEl.style.display = 'block';

  container.innerHTML = cart.map(item => {
    let p = PRODUCTS.find(x => String(x.id) === String(item.id));
    if (!p && window.__productsCache) p = window.__productsCache.find(x => String(x.id) === String(item.id));
    const stock = p && typeof p.stock !== 'undefined' ? parseInt(p.stock) : 10;
    const maxReached = item.qty >= stock;

    const imgHTML = (item.image && typeof item.image === 'string' && item.image.trim() !== '')
      ? `<img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.onerror=null; this.outerHTML='<div class=\\'cart-item-img-placeholder\\'>${item.emoji || '🌸'}</div>';">`
      : `<div class="cart-item-img-placeholder">${item.emoji || '🌸'}</div>`;
    return `
      <div class="cart-item" id="ci-${item.id}">
        ${imgHTML}
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>$${formatPrice(item.price)} each</p>
          <div class="qty-control">
            <button class="qty-btn" onclick="updateQty('${item.id}',-1)">−</button>
            <span class="qty-num">${item.qty}</span>
            <button class="qty-btn" onclick="updateQty('${item.id}',1)" ${maxReached ? 'disabled style="opacity:0.5;cursor:not-allowed;"' : ''}>+</button>
          </div>
        </div>
        <div class="cart-item-price">
          <strong>$${formatPrice(item.price * item.qty)}</strong>
          <button class="remove-btn" onclick="removeFromCart('${item.id}')" title="Remove item">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Remove
          </button>
        </div>
      </div>`;
  }).join('');

  // Summary
  const subtotal = getCartTotal();
  let discount = 0;
  if (appliedPromoCode) {
    const matchedPromo = getMatchedPromoCode(appliedPromoCode);
    if (matchedPromo) {
      discount = roundPrice(subtotal * (matchedPromo.discount / 100));
    }
  }

  const discountRow = document.getElementById('summary-discount-row');
  const discountLabel = document.getElementById('summary-discount-label');
  const discountValue = document.getElementById('summary-discount-value');

  if (discount > 0) {
    if (discountRow) discountRow.style.display = 'flex';
    if (discountLabel) discountLabel.textContent = `Discount (${appliedPromoCode})`;
    if (discountValue) discountValue.textContent = `-$${formatPrice(discount)}`;
  } else {
    if (discountRow) discountRow.style.display = 'none';
  }

  const shipCost = parseFloat(window.storeSettings.shippingCost) || 0;
  const shipThreshold = parseFloat(window.storeSettings.freeShippingThreshold) || 50;
  const shipping = subtotal >= shipThreshold ? 0 : shipCost;
  const total = roundPrice(subtotal - discount + shipping);

  document.getElementById('summary-subtotal').textContent = `$${formatPrice(subtotal)}`;
  document.getElementById('summary-shipping').textContent = shipping === 0 ? 'FREE' : `$${formatPrice(shipping)}`;
  document.getElementById('summary-total').textContent = `$${formatPrice(total)}`;

  const freeShippingMsg = document.getElementById('free-shipping-msg');
  if (freeShippingMsg) {
    const thresholdFormatted = shipThreshold % 1 === 0 ? shipThreshold : formatPrice(shipThreshold);
    freeShippingMsg.textContent = `Free shipping on orders over $${thresholdFormatted} 🎁`;
  }
}

function initCartPage() {
  renderCartPage();
  const checkoutBtn = document.getElementById('checkout-btn');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', async () => {
      if (cart.length === 0) { showToast('Your cart is empty', 'error'); return; }

      const originalText = checkoutBtn.textContent;
      checkoutBtn.disabled = true;
      checkoutBtn.textContent = 'Processing...';

      try {
        // Validate stock before checkout
        for (const item of cart) {
          let currentStock = 10;
          let p = PRODUCTS.find(x => String(x.id) === String(item.id));
          if (!p && window.__productsCache) {
            p = window.__productsCache.find(x => String(x.id) === String(item.id));
          }
          if (p) currentStock = typeof p.stock !== 'undefined' ? parseInt(p.stock) : 10;

          if (typeof window.firestoreGetDoc === 'function') {
            try {
              const docSnap = await window.firestoreGetDoc('products', String(item.id));
              if (docSnap.exists()) {
                currentStock = typeof docSnap.data().stock !== 'undefined' ? parseInt(docSnap.data().stock) : 10;
              }
            } catch (e) {}
          }
          
          if (item.qty > currentStock) {
            showToast('Some items are no longer available in requested quantity.', 'error');
            checkoutBtn.disabled = false;
            checkoutBtn.textContent = originalText;
            return;
          }
        }

        const storeSettings = window.storeSettings;

        const subtotal = getCartTotal();
        let discount = 0;
        if (appliedPromoCode) {
          const matchedPromo = getMatchedPromoCode(appliedPromoCode);
          if (matchedPromo) {
            discount = roundPrice(subtotal * (matchedPromo.discount / 100));
          }
        }
        
        const shipCost = parseFloat(storeSettings.shippingCost) || 0;
        const shipThreshold = parseFloat(storeSettings.freeShippingThreshold) || 50;
        const shipping = subtotal >= shipThreshold ? 0 : shipCost;
        const total = roundPrice(subtotal - discount + shipping);

        // Helper functions for order completion
        async function deductStockForCartItems(cartItems) {
          for (const item of cartItems) {
            let p = PRODUCTS.find(x => String(x.id) === String(item.id));
            if (!p && window.__productsCache) {
              p = window.__productsCache.find(x => String(x.id) === String(item.id));
            }
            let currentStock = p && typeof p.stock !== 'undefined' ? parseInt(p.stock) : 10;

            if (typeof window.firestoreGetDoc === 'function' && typeof window.firestoreUpdateDoc === 'function') {
              try {
                const docSnap = await window.firestoreGetDoc('products', String(item.id));
                if (docSnap.exists()) {
                  const data = docSnap.data();
                  currentStock = typeof data.stock !== 'undefined' ? parseInt(data.stock) : 10;
                  const newStock = Math.max(0, currentStock - item.qty);
                  await window.firestoreUpdateDoc('products', String(item.id), { stock: newStock });
                  currentStock = newStock;
                }
              } catch (err) {}
            }

            const newStock = Math.max(0, currentStock - item.qty);
            
            // Update memory
            if (p) p.stock = newStock;

            // Sync to localStorage for hardcoded products
            let dashSaved = [];
            try {
              dashSaved = JSON.parse(localStorage.getItem('lueur_dash_products') || '[]');
            } catch(e) {}
            let dProduct = dashSaved.find(x => String(x.id) === String(item.id));
            if (dProduct) {
              dProduct.stock = newStock;
            } else if (p) {
              dashSaved.push({ ...p });
            }
            localStorage.setItem('lueur_dash_products', JSON.stringify(dashSaved));
          }
        }

        function finalizeCheckout() {
          cart = [];
          appliedPromoCode = null;
          localStorage.removeItem('lueur_promo');
          saveCart();
          updateCartBadges();
          renderCartPage();
          resetCheckoutBtn();
        }

        function resetCheckoutBtn() {
          checkoutBtn.disabled = false;
          checkoutBtn.textContent = originalText;
        }

        const paymentRadio = document.querySelector('input[name="payment-method"]:checked');
        const paymentMethod = paymentRadio ? paymentRadio.value : 'COD';

        if (paymentMethod === 'Razorpay') {
          if (typeof Razorpay === 'undefined') {
            showToast('Razorpay is not loaded yet. Please refresh the page and try again.', 'error');
            resetCheckoutBtn();
            return;
          }

          let customerEmail = '';
          let customerName = '';
          if (window.auth && window.auth.currentUser) {
            customerEmail = window.auth.currentUser.email || 'Guest Customer';
            customerName = window.auth.currentUser.displayName || (customerEmail.split('@')[0] !== 'Guest Customer' ? customerEmail.split('@')[0] : 'Guest');
          } else {
            customerEmail = 'Guest Customer';
            customerName = 'Guest';
          }

          const options = {
            key: "rzp_test_T2h44XwpY4KrPB",
            amount: Math.round(total * 100),
            currency: storeSettings.currency || 'USD',
            name: storeSettings.storeName || "Lueur Beauty",
            description: "Online Payment",
            image: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌸</text></svg>",
            handler: async function (response) {
              try {
                if (typeof window.firestoreAddDoc === 'function') {
                  const orderData = {
                    items: cart,
                    subtotal: subtotal,
                    discount: discount,
                    shipping: shipping,
                    total: total,
                    status: 'Pending',
                    paymentMethod: 'Razorpay',
                    paymentStatus: 'Paid',
                    razorpayPaymentId: response.razorpay_payment_id
                  };
                  if (window.auth && window.auth.currentUser) {
                    orderData.customerEmail = window.auth.currentUser.email || 'Guest Customer';
                    orderData.customerId = window.auth.currentUser.uid;
                    orderData.customerName = window.auth.currentUser.displayName || (orderData.customerEmail.split('@')[0] !== 'Guest Customer' ? orderData.customerEmail.split('@')[0] : 'Guest');
                  } else {
                    let anonId = localStorage.getItem('lueur_anon_id');
                    if (!anonId) {
                      anonId = 'guest_' + Math.random().toString(36).substr(2, 9);
                      localStorage.setItem('lueur_anon_id', anonId);
                    }
                    orderData.customerEmail = 'Guest Customer';
                    orderData.customerName = 'Guest';
                    orderData.customerId = anonId;
                  }
                  if (appliedPromoCode) {
                    orderData.promoCode = appliedPromoCode;
                  }
                  await window.firestoreAddDoc('orders', orderData);
                  await deductStockForCartItems(cart);
                }
                showToast('Payment successful! Order placed — thank you for your purchase!', 'success');
                finalizeCheckout();
              } catch (err) {
                console.error('Checkout failed after payment:', err);
                showToast('Payment was successful, but failed to create order. Please contact support.', 'error');
                resetCheckoutBtn();
              }
            },
            prefill: {
              name: customerName,
              email: customerEmail === 'Guest Customer' ? '' : customerEmail
            },
            theme: {
              color: "#e8748a"
            },
            modal: {
              ondismiss: function () {
                showToast('Payment cancelled.', 'error');
                resetCheckoutBtn();
              }
            }
          };

          const rzp = new Razorpay(options);
          rzp.on('payment.failed', function (response) {
            showToast(response.error.description || 'Payment failed.', 'error');
            resetCheckoutBtn();
          });
          rzp.open();
        } else {
          // COD Flow
          if (typeof window.firestoreAddDoc === 'function') {
            const orderData = {
              items: cart,
              subtotal: subtotal,
              discount: discount,
              shipping: shipping,
              total: total,
              status: 'Pending',
              paymentMethod: 'COD',
              paymentStatus: 'Pending'
            };
            if (window.auth && window.auth.currentUser) {
              orderData.customerEmail = window.auth.currentUser.email || 'Guest Customer';
              orderData.customerId = window.auth.currentUser.uid;
              orderData.customerName = window.auth.currentUser.displayName || (orderData.customerEmail.split('@')[0] !== 'Guest Customer' ? orderData.customerEmail.split('@')[0] : 'Guest');
            } else {
              let anonId = localStorage.getItem('lueur_anon_id');
              if (!anonId) {
                anonId = 'guest_' + Math.random().toString(36).substr(2, 9);
                localStorage.setItem('lueur_anon_id', anonId);
              }
              orderData.customerEmail = 'Guest Customer';
              orderData.customerName = 'Guest';
              orderData.customerId = anonId;
            }
            if (appliedPromoCode) {
              orderData.promoCode = appliedPromoCode;
            }
            await window.firestoreAddDoc('orders', orderData);
            await deductStockForCartItems(cart);
          }
          showToast('Order placed — thank you for your purchase!', 'success');
          finalizeCheckout();
        }
      } catch (err) {
        console.error('Checkout failed:', err);
        showToast('Failed to process order. Please try again.', 'error');
      } finally {
        checkoutBtn.disabled = false;
        checkoutBtn.textContent = originalText;
      }
    });
  }
  const promoBtn = document.getElementById('promo-apply');
  if (promoBtn) {
    promoBtn.addEventListener('click', () => {
      const code = document.getElementById('promo-code').value.trim().toUpperCase();
      if (!code) { showToast('Please enter a promo code', 'error'); return; }
      const matchedPromo = getMatchedPromoCode(code);
      if (matchedPromo) {
        appliedPromoCode = code;
        localStorage.setItem('lueur_promo', code);
        showToast(`Promo code applied — ${matchedPromo.discount}% off`, 'success');
        renderCartPage();
      } else {
        showToast('Invalid or expired promo code', 'error');
      }
    });
  }
}

/* ===== AUTH PAGE ===== */
function authErrorMessage(code) {
  const map = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/email-already-in-use': 'An account with that email already exists.',
    'auth/weak-password': 'Password must be at least 8 characters.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/network-request-failed': 'Network error. Check your connection.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}

function initAuthPage() {
  // ── Tab switching (unchanged UI behaviour) ──────────────────────────────
  const tabs = document.querySelectorAll('.auth-tab');
  const forms = document.querySelectorAll('.auth-form');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      forms.forEach(f => f.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.tab).classList.add('active');
    });
  });

  // ── Login ───────────────────────────────────────────────────────────────
  document.getElementById('login-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-pass').value;
    const btn = e.target.querySelector('button[type="submit"]');

    // ── Seller shortcut (encrypted session generation) ───────────────────
    const passwordHash = await sha256(password);
    if (email.toLowerCase() === SELLER_EMAIL.toLowerCase() && passwordHash === SELLER_PASSWORD_HASH) {
      const timestamp = Date.now();
      const signature = await sha256(email.toLowerCase() + timestamp + SELLER_SECRET);
      const session = {
        email: email.toLowerCase(),
        timestamp: timestamp,
        signature: signature
      };
      localStorage.setItem('lueur_seller_auth', JSON.stringify(session));
      showToast('Welcome back, Seller!', 'success');
      setTimeout(() => { window.location.href = 'dashboard.html'; }, 700);
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Signing in…';

    try {
      await window.firebaseSignIn(email, password);
      showToast('Welcome back to Lueur Beauty!', 'success');
      setTimeout(() => window.location.href = 'index.html', 1200);
    } catch (err) {
      showToast(authErrorMessage(err.code), 'error');
      btn.disabled = false;
      btn.textContent = 'Sign In';
    }
  });

  // ── Signup ──────────────────────────────────────────────────────────────
  document.getElementById('signup-form')?.addEventListener('submit', async e => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-pass').value;
    const btn = e.target.querySelector('button[type="submit"]');

    btn.disabled = true;
    btn.textContent = 'Creating account…';

    try {
      await window.firebaseSignUp(email, password);
      showToast('Account created — welcome to Lueur Beauty!', 'success');
      setTimeout(() => window.location.href = 'index.html', 1200);
    } catch (err) {
      showToast(authErrorMessage(err.code), 'error');
      btn.disabled = false;
      btn.textContent = 'Create Account';
    }
  });
}

/* ===== DASHBOARD ===== */
let dashProducts = JSON.parse(localStorage.getItem('lueur_dash_products') || 'null') || PRODUCTS.map(p => ({ ...p }));
let dashOrders = [];
let dashMessages = [];

function saveDashProducts() { localStorage.setItem('lueur_dash_products', JSON.stringify(dashProducts)); }

// -- DYNAMIC GREETING --
function updateSellerGreeting() {
  const el = document.getElementById('seller-greeting');
  if (!el) return;
  const hour = new Date().getHours();
  let greeting = 'Good morning, Seller';
  if (hour >= 5 && hour < 12) greeting = 'Good morning, Seller';
  else if (hour >= 12 && hour < 17) greeting = 'Good afternoon, Seller';
  else if (hour >= 17 && hour < 22) greeting = 'Good evening, Seller';
  else greeting = 'Working late, Seller';
  el.textContent = greeting;
}

// -- DATA PROCESSING & RENDERING --
function processProducts(snapshot) {
  let firestoreProducts = [];
  snapshot.forEach(docSnap => {
    firestoreProducts.push({ id: docSnap.id, ...docSnap.data() });
  });

  const inventoryProducts = [...PRODUCTS, ...firestoreProducts];
  const uniqueInventory = [];
  const seenNames = new Set();
  for (const p of inventoryProducts) {
    const name = p.name ? p.name.toLowerCase().trim() : '';
    if (!seenNames.has(name)) {
      seenNames.add(name);
      uniqueInventory.push(p);
    }
  }

  dashProducts = uniqueInventory;
  saveDashProducts();
  renderAllDashboardViews();
}

function processOrders(snapshot) {
  dashOrders = [];
  snapshot.forEach(docSnap => {
    dashOrders.push({ id: docSnap.id, ...docSnap.data() });
  });
  dashOrders.sort((a, b) => {
    const timeA = a.createdAt?.seconds || (typeof a.createdAt === 'number' ? a.createdAt / 1000 : 0);
    const timeB = b.createdAt?.seconds || (typeof b.createdAt === 'number' ? b.createdAt / 1000 : 0);
    return timeB - timeA;
  });
  renderAllDashboardViews();
}

function processMessages(snapshot) {
  dashMessages = [];
  snapshot.forEach(docSnap => {
    dashMessages.push({ id: docSnap.id, ...docSnap.data() });
  });
  dashMessages.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  renderAllDashboardViews();
}

// -- ROUTING --
function switchDashView(targetId) {
  document.querySelectorAll('.dash-view').forEach(v => v.classList.remove('active'));
  const view = document.getElementById(targetId);
  if (view) view.classList.add('active');
  
  if (targetId === 'view-dashboard') document.getElementById('add-product-btn').style.display = 'none';
  else if (targetId === 'view-products') document.getElementById('add-product-btn').style.display = 'inline-flex';
  else document.getElementById('add-product-btn').style.display = 'none';
}

/* ===== SELLER AUTH CONSTANTS ===== */
const SELLER_EMAIL = 'seller.lueur@admin.com';
const SELLER_PASSWORD_HASH = '3f94e9239b744bfdd953671b78bc069dce93f9f9a474768606200f39d16eff33';
const SELLER_SECRET = 'lueur_secret_salt_2026';

async function checkSellerAuth() {
  const token = localStorage.getItem('lueur_seller_auth');
  if (!token) return false;
  try {
    const session = JSON.parse(token);
    const { email, timestamp, signature } = session;
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;
    if (now - timestamp > oneDay || email !== SELLER_EMAIL.toLowerCase()) {
      return false;
    }
    const expectedSignature = await sha256(email + timestamp + SELLER_SECRET);
    return signature === expectedSignature;
  } catch (e) {
    return false;
  }
}

/* ===== DASHBOARD ===== */
async function initDashboard() {
  // Guard: only allow seller
  const isAuth = await checkSellerAuth();
  if (!isAuth) {
    window.location.replace('login.html');
    return;
  }

  // Logout buttons (both sidebar and navbar)
  const logoutSelector = '#dash-logout-btn, .navbar a[href="login.html"]';
  document.querySelectorAll(logoutSelector).forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      localStorage.removeItem('lueur_seller_auth');
      window.location.href = 'login.html';
    });
  });

  updateSellerGreeting();

  if (typeof window.firestoreOnSnapshot === 'function') {
    window.firestoreOnSnapshot('products', processProducts);
    window.firestoreOnSnapshot('orders', processOrders);
    window.firestoreOnSnapshot('messages', processMessages);
  }

  // Sidebar nav routing
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.addEventListener('click', () => {
      document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      const target = link.getAttribute('data-target');
      if (target) {
        switchDashView(target);
        if (target === 'view-messages') {
          messageReadIds = dashMessages.map(m => m.id);
          localStorage.setItem('lueur_messages_read', JSON.stringify(messageReadIds));
          renderDashMessages();
        }
        if (target === 'view-notifications') {
          markAllNotificationsRead();
        }
      }
    });
  });

  // Settings
  initSettingsForm();

  // Pricing auto-calculation
  const formMRP = document.getElementById('form-mrp');
  const formPrice = document.getElementById('form-price');
  const formDiscount = document.getElementById('form-discount');

  const calcDiscount = () => {
    if(formMRP && formPrice && formMRP.value && formPrice.value) {
      let mrp = parseFloat(formMRP.value);
      let sale = parseFloat(formPrice.value);
      if(mrp > 0 && sale <= mrp) {
        formDiscount.value = Math.round(((mrp - sale) / mrp) * 100);
      }
    }
  };
  const calcSale = () => {
    if(formMRP && formDiscount && formMRP.value && formDiscount.value) {
      let mrp = parseFloat(formMRP.value);
      let disc = parseFloat(formDiscount.value);
      if(mrp > 0 && disc >= 0 && disc <= 100) {
        formPrice.value = (mrp - (mrp * disc / 100)).toFixed(2);
      }
    }
  };
  formMRP?.addEventListener('input', calcDiscount);
  formPrice?.addEventListener('input', calcDiscount);
  formDiscount?.addEventListener('input', calcSale);

  // Add product btn
  document.getElementById('add-product-btn')?.addEventListener('click', () => openProductModal());
  document.getElementById('modal-product-form')?.addEventListener('submit', handleProductFormSubmit);
  document.querySelector('.modal-close')?.addEventListener('click', closeProductModal);
  document.getElementById('product-modal')?.addEventListener('click', e => { if (e.target.id === 'product-modal') closeProductModal(); });

  // Image preview on file select
  document.getElementById('form-image')?.addEventListener('change', e => {
    const file = e.target.files[0];
    const preview = document.getElementById('form-image-preview');
    if (!preview) return;
    if (file) {
      const url = URL.createObjectURL(file);
      preview.innerHTML = `<img src="${url}" alt="Preview" style="max-width:100%;max-height:120px;border-radius:4px;border:1px solid var(--border);object-fit:cover;">`;
    } else {
      preview.innerHTML = '';
    }
  });
}

function renderAllDashboardViews() {
  renderDashStats();
  renderDashProductsTable();
  renderDashOrders();
  renderDashCustomers();
  renderDashAnalytics();
  renderDashNotifications();
  renderDashMessages();
}

function renderDashStats() {
  const totalProducts = dashProducts.length;
  const totalOrders = dashOrders.length;
  const revenue = dashOrders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
  const uniqueCustomers = new Set(dashOrders.map(o => o.customerId || o.customerEmail || 'unknown')).size;

  const stats = [
    { icon: '📦', label: 'Total Products', value: totalProducts, trend: '+ Live' },
    { icon: '🛒', label: 'Total Orders', value: totalOrders, trend: '+ Live' },
    { icon: '💰', label: 'Revenue', value: `$${formatPrice(revenue)}`, trend: '+ Live' },
    { icon: '👥', label: 'Customers', value: uniqueCustomers, trend: '+ Live' },
  ];
  const container = document.getElementById('stats-cards');
  if (container) {
    container.innerHTML = stats.map(s => `
      <div class="stat-card">
        <div class="stat-card-icon">${s.icon}</div>
        <h3>${s.value}</h3>
        <p>${s.label}</p>
        <div class="trend up">↑ ${s.trend}</div>
      </div>`).join('');
  }
}

function renderDashProductsTable() {
  const tbody = document.getElementById('products-tbody');
  if (!tbody) return;
  tbody.innerHTML = dashProducts.length ? dashProducts.map(p => {
    const price = parseFloat(p.price) || 0;
    const stock = parseInt(p.stock) || 0;
    const emoji = p.emoji || '🌸';
    const imgHTML = p.image
      ? `<img src="${p.image}" class="td-thumb" alt="${p.name}">`
      : `<div class="td-thumb-placeholder">${emoji}</div>`;
    const stockBadge = stock > 20 ? 'badge-green' : stock > 5 ? 'badge-yellow' : 'badge-pink';
    return `
      <tr>
        <td><div class="td-img">${imgHTML}<span>${p.name}</span></div></td>
        <td>${p.category}</td>
        <td>$${formatPrice(price)}</td>
        <td><span class="badge ${stockBadge}">${stock} units</span></td>
        <td>
          <div class="action-btns">
            <button class="icon-btn icon-btn-edit" onclick="openProductModal('${p.id}')" title="Edit">✏️</button>
            <button class="icon-btn icon-btn-delete" onclick="deleteProduct('${p.id}')" title="Delete">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('') : '<tr><td colspan="5" style="text-align:center;padding:24px;color:var(--text-light)">No products found</td></tr>';
}

function renderDashOrders() {
  const allTbody = document.getElementById('orders-all-tbody');
  const recentTbody = document.getElementById('orders-recent-tbody');
  
  const htmlRows = dashOrders.map(order => {
    const orderId = order.id.slice(0, 6).toUpperCase();
    let dateStr = 'Unknown';
    if (order.createdAt && order.createdAt.seconds) {
      dateStr = new Date(order.createdAt.seconds * 1000).toLocaleDateString();
    } else if (order.createdAt) {
      dateStr = new Date(order.createdAt).toLocaleDateString();
    }

    const productsStr = order.items && Array.isArray(order.items)
      ? order.items.map(i => `${i.name} × ${i.qty}`).join('<br>')
      : 'Unknown items';

    const total = parseFloat(order.total) || 0;
    const statuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    const selectHtml = `
      <select 
        style="padding:4px 8px;font-size:0.85rem;border:1px solid var(--border);border-radius:4px;background:var(--bg-light);color:var(--text-main);outline:none;cursor:pointer"
        onchange="updateOrderStatus('${order.id}', this.value)"
      >
        ${statuses.map(s => `<option value="${s}" ${order.status === s ? 'selected' : ''}>${s}</option>`).join('')}
      </select>
    `;

    return `
      <tr>
        <td style="font-family:monospace;font-size:0.9em;color:var(--text-light)">#LB-${orderId}</td>
        <td>${dateStr}</td>
        <td style="line-height:1.4;font-size:0.9em">${productsStr}</td>
        <td style="color:var(--rose);font-weight:600">$${formatPrice(total)}</td>
        <td>${order.promoCode ? `<span class="badge badge-pink">${order.promoCode}</span>` : '<span style="color:var(--text-light)">-</span>'}</td>
        <td><span style="font-weight:500;">${order.paymentMethod || 'COD'}</span></td>
        <td><span class="badge ${order.paymentStatus === 'Paid' ? 'badge-green' : 'badge-yellow'}">${order.paymentStatus || 'Pending'}</span></td>
        <td>${selectHtml}</td>
      </tr>`;
  });

  if (allTbody) allTbody.innerHTML = htmlRows.length ? htmlRows.join('') : '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-light)">No orders found</td></tr>';
  if (recentTbody) recentTbody.innerHTML = htmlRows.length ? htmlRows.slice(0,5).join('') : '<tr><td colspan="8" style="text-align:center;padding:24px;color:var(--text-light)">No recent orders</td></tr>';
}

function renderDashCustomers() {
  const tbody = document.getElementById('customers-tbody');
  if (!tbody) return;

  const customersMap = {};
  dashOrders.forEach(o => {
    const id = o.customerId || o.customerEmail || 'Guest';
    const email = o.customerEmail || 'Guest';
    const name = o.customerName || (email !== 'Guest' ? email : 'Guest');
    if (!customersMap[id]) {
      customersMap[id] = { id, email, name, ordersCount: 0, totalSpent: 0, lastOrderTime: 0 };
    }
    customersMap[id].ordersCount++;
    customersMap[id].totalSpent += parseFloat(o.total) || 0;
    const time = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : (typeof o.createdAt === 'number' ? o.createdAt : 0);
    if (time > customersMap[id].lastOrderTime) customersMap[id].lastOrderTime = time;
  });

  const customersArray = Object.values(customersMap).sort((a,b) => b.totalSpent - a.totalSpent);
  
  tbody.innerHTML = customersArray.length ? customersArray.map(c => `
    <tr>
      <td>
        <div style="font-weight:600">${c.name}</div>
        <div style="font-size:0.8rem;color:var(--text-light)">${c.email !== 'Guest' ? c.email : ''}</div>
      </td>
      <td>${c.ordersCount}</td>
      <td>$${formatPrice(c.totalSpent)}</td>
      <td>${c.lastOrderTime ? new Date(c.lastOrderTime).toLocaleDateString() : 'N/A'}</td>
    </tr>
  `).join('') : '<tr><td colspan="4" style="text-align:center;padding:24px;color:var(--text-light)">No customers found</td></tr>';
}

function renderDashAnalytics() {
  const container = document.getElementById('analytics-cards');
  const lowStockTbody = document.getElementById('low-stock-tbody');
  if (!container) return;

  const delivered = dashOrders.filter(o => o.status === 'Delivered').length;
  const pending = dashOrders.filter(o => o.status === 'Pending').length;
  const cancelled = dashOrders.filter(o => o.status === 'Cancelled').length;
  
  // Best selling
  const productSales = {};
  dashOrders.forEach(o => {
    if (o.status !== 'Cancelled' && o.items) {
      o.items.forEach(i => {
        productSales[i.name] = (productSales[i.name] || 0) + i.qty;
      });
    }
  });
  let topProduct = 'None';
  let topSales = 0;
  for (const [name, qty] of Object.entries(productSales)) {
    if (qty > topSales) { topSales = qty; topProduct = name; }
  }

  const stats = [
    { label: 'Delivered Orders', value: delivered },
    { label: 'Pending Orders', value: pending },
    { label: 'Cancelled Orders', value: cancelled },
    { label: 'Best Seller', value: topProduct }
  ];

  container.innerHTML = stats.map(s => `
    <div class="stat-card">
      <p style="font-size:0.8rem;color:var(--text-primary);text-transform:uppercase;letter-spacing:1px;font-weight:700">${s.label}</p>
      <h3 style="font-size:1.6rem;font-family:var(--font-heading);margin-top:8px;color:var(--text-primary);font-weight:600">${s.value}</h3>
    </div>
  `).join('');

  // Low stock
  const lowStock = dashProducts.filter(p => parseInt(p.stock) < 10).sort((a,b) => parseInt(a.stock) - parseInt(b.stock));
  if (lowStockTbody) {
    lowStockTbody.innerHTML = lowStock.length ? lowStock.map(p => `
      <tr>
        <td>${p.name}</td>
        <td><span class="badge ${p.stock <= 0 ? 'badge-pink' : 'badge-yellow'}">${p.stock}</span></td>
        <td>$${formatPrice(p.price)}</td>
      </tr>
    `).join('') : '<tr><td colspan="3" style="text-align:center;padding:24px;color:var(--text-light)">All stock levels healthy</td></tr>';
  }
}

let notificationReadIds = JSON.parse(localStorage.getItem('lueur_notifications_read') || '[]');
let messageReadIds = JSON.parse(localStorage.getItem('lueur_messages_read') || '[]');

window.markAllNotificationsRead = function() {
  const notifs = generateNotifications();
  notificationReadIds = notifs.map(n => n.id);
  localStorage.setItem('lueur_notifications_read', JSON.stringify(notificationReadIds));
  renderDashNotifications();
};

function generateNotifications() {
  const notifs = [];
  // Low Stock
  dashProducts.forEach(p => {
    if (parseInt(p.stock) <= 0) {
      notifs.push({ id: `oos_${p.id}`, title: `Out of Stock: ${p.name}`, msg: `Please restock ${p.name} immediately.`, time: Date.now() });
    } else if (parseInt(p.stock) < 10) {
      notifs.push({ id: `low_${p.id}`, title: `Low Stock: ${p.name}`, msg: `Only ${p.stock} units left for ${p.name}.`, time: Date.now() - 3600000 });
    }
  });

  // Recent orders
  dashOrders.slice(0, 10).forEach(o => {
    const time = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : (typeof o.createdAt === 'number' ? o.createdAt : Date.now());
    if (o.status === 'Pending') {
      notifs.push({ id: `neword_${o.id}`, title: `New Order Received`, msg: `Order #LB-${o.id.slice(0,6).toUpperCase()} is pending fulfillment.`, time });
    } else if (o.status === 'Cancelled') {
      notifs.push({ id: `canord_${o.id}`, title: `Order Cancelled`, msg: `Order #LB-${o.id.slice(0,6).toUpperCase()} was cancelled.`, time });
    }
  });

  // Recent messages
  dashMessages.slice(0, 10).forEach(m => {
    const time = m.timestamp || Date.now();
    notifs.push({
      id: `msg_${m.id}`,
      title: `New Message from ${m.name}`,
      msg: `Subject: ${m.subject} - "${m.message.slice(0, 60)}${m.message.length > 60 ? '...' : ''}"`,
      time
    });
  });

  notifs.sort((a,b) => b.time - a.time);
  return notifs;
}

function renderDashNotifications() {
  const container = document.getElementById('notifications-list');
  if (!container) return;

  const notifs = generateNotifications();
  const unreadNotifs = notifs.filter(n => !notificationReadIds.includes(n.id));
  const badge = document.getElementById('nav-notif-badge');
  if (badge) {
    if (unreadNotifs.length > 0) {
      badge.textContent = unreadNotifs.length;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  container.innerHTML = notifs.length ? notifs.map(n => {
    const isRead = notificationReadIds.includes(n.id);
    const dateStr = new Date(n.time).toLocaleString();
    return `
      <div class="notification-item ${isRead ? 'read' : 'unread'}" 
           style="padding:14px; border-bottom:1px solid var(--border); display:flex; flex-direction:column; gap:4px; transition: background 0.3s; ${isRead ? 'opacity: 0.7;' : 'background: rgba(232, 116, 138, 0.05); border-left: 3px solid var(--rose);'}">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h4 style="margin:0; font-size:0.95rem; font-weight:600; color:var(--text-dark);">${n.title}</h4>
          <span style="font-size:0.75rem; color:var(--text-muted);">${dateStr}</span>
        </div>
        <p style="margin:4px 0 0 0; font-size:0.85rem; color:var(--text-light); line-height:1.4;">${n.msg}</p>
      </div>`;
  }).join('') : '<div style="padding:24px; text-align:center; color:var(--text-light)">No notifications</div>';
}

function renderDashMessages() {
  const list = document.getElementById('messages-list');
  if (!list) return;
  const msgs = dashMessages;

  // Update messages badge in sidebar
  const badge = document.getElementById('nav-msg-badge');
  if (badge) {
    const unreadCount = msgs.filter(m => !messageReadIds.includes(m.id)).length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  list.innerHTML = msgs.length ? msgs.map(m => {
    const isRead = messageReadIds.includes(m.id);
    return `
      <div style="padding:16px; border-bottom:1px solid var(--border); display:flex; flex-direction:column; gap:6px; ${isRead ? 'opacity: 0.85;' : 'border-left: 3px solid var(--rose); background: rgba(232, 116, 138, 0.02);'}">
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
          <span style="font-weight:600; font-size:.95rem; color:var(--text-dark);">${m.name} (${m.email})</span>
          <span style="font-size:.75rem; color:var(--text-muted)">${new Date(m.timestamp).toLocaleString()}</span>
        </div>
        <div style="font-weight:500; font-size:.85rem; color:var(--primary); margin-top:2px;">Subject: ${m.subject}</div>
        <p style="font-size:.85rem; color:var(--text-light); margin:4px 0 0 0; line-height:1.4;">${m.message}</p>
      </div>`;
  }).join('') : '<div style="padding:24px; text-align:center; color:var(--text-light)">No messages</div>';
}

window.markAllMessagesRead = function() {
  messageReadIds = dashMessages.map(m => m.id);
  localStorage.setItem('lueur_messages_read', JSON.stringify(messageReadIds));
  renderDashMessages();
};

function setupMessageListener() {
  if (typeof window.firestoreOnSnapshot === 'function') {
    window.firestoreOnSnapshot('notifications', snap => {
      renderDashNotifications();
    });
    window.firestoreOnSnapshot('messages', snap => {
      renderDashMessages();
    });
  }
}

function populateSettingsForm(d) {
  document.getElementById('set-store-name').value = d.storeName || '';
  document.getElementById('set-store-email').value = d.storeEmail || '';
  document.getElementById('set-store-phone').value = d.storePhone || '';
  document.getElementById('set-store-address').value = d.storeAddress || '';
  document.getElementById('set-currency').value = d.currency || 'USD';
  document.getElementById('set-shipping').value = d.shippingCost !== undefined ? d.shippingCost : '';
  document.getElementById('set-free-shipping').value = d.freeShippingThreshold !== undefined ? d.freeShippingThreshold : '';
  if (d.promoCodes) {
    window.storeSettings.promoCodes = d.promoCodes;
  }
  renderPromoCodes();
}

async function loadSettingsFromFirestore() {
  try {
    if (typeof window.firestoreGetDoc === 'function') {
      const docSnap = await window.firestoreGetDoc('settings', 'store_settings');
      if (docSnap.exists()) {
        const firestoreData = docSnap.data();
        window.storeSettings = { ...window.storeSettings, ...firestoreData };
        populateSettingsForm(firestoreData);
        renderFooterContactDetails();
        return;
      }
    }
    // Fallback to localStorage
    const local = JSON.parse(localStorage.getItem('lueur_store_settings') || '{}');
    if (Object.keys(local).length) {
      window.storeSettings = { ...window.storeSettings, ...local };
      populateSettingsForm(local);
      renderFooterContactDetails();
    }
  } catch (err) {
    console.warn('Settings load failed:', err);
  }
}

function initSettingsForm() {
  const form = document.getElementById('settings-form');
  if (!form) return;

  loadSettingsFromFirestore();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = document.getElementById('save-settings-btn');
    const ogText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    const data = {
      storeName: document.getElementById('set-store-name').value.trim(),
      storeEmail: document.getElementById('set-store-email').value.trim(),
      storePhone: document.getElementById('set-store-phone').value.trim(),
      storeAddress: document.getElementById('set-store-address').value.trim(),
      currency: document.getElementById('set-currency').value.trim() || 'USD',
      shippingCost: parseFloat(document.getElementById('set-shipping').value) || 0,
      freeShippingThreshold: parseFloat(document.getElementById('set-free-shipping').value) || 0,
      promoCodes: window.storeSettings.promoCodes || [],
    };

    // Always save to localStorage as reliable fallback
    localStorage.setItem('lueur_store_settings', JSON.stringify(data));

    let savedToFirestore = false;
    if (typeof window.firestoreSetDoc === 'function') {
      try {
        await window.firestoreSetDoc('settings', 'store_settings', data);
        savedToFirestore = true;
      } catch (err) {
        console.warn('Firestore setDoc failed, trying updateDoc:', err);
      }
    }
    if (!savedToFirestore && typeof window.firestoreUpdateDoc === 'function') {
      try {
        await window.firestoreUpdateDoc('settings', 'store_settings', data);
        savedToFirestore = true;
      } catch (err) {
        console.warn('Firestore updateDoc also failed:', err);
      }
    }

    showToast(
      savedToFirestore ? '✅ Settings saved to Firestore.' : '✅ Settings saved locally.',
      'success'
    );

    // Reload values to confirm persistence
    await loadSettingsFromFirestore();

    btn.textContent = ogText;
    btn.disabled = false;
  });

  // Initialize promo code manager
  initPromoCodeManager();
}

/* ===== PROMO CODE MANAGEMENT ===== */
function renderPromoCodes() {
  const container = document.getElementById('promo-codes-list');
  if (!container) return;
  const codes = window.storeSettings.promoCodes || [];

  if (codes.length === 0) {
    container.innerHTML = '<div style="padding:12px; text-align:center; color:var(--text-muted); font-size:0.85rem;">No promo codes added yet. Add one below.</div>';
    return;
  }

  container.innerHTML = codes.map((c, i) => `
    <div style="display:flex; align-items:center; gap:12px; padding:12px 14px; border-bottom:1px solid var(--border); transition:background 0.2s;
      ${c.active !== false ? '' : 'opacity:0.5;'}">
      <div style="flex:1; display:flex; align-items:center; gap:10px;">
        <span style="font-weight:700; font-size:0.95rem; letter-spacing:0.5px; color:var(--primary); font-family:monospace; background:rgba(232,116,138,0.08); padding:4px 10px; border-radius:6px;">${c.code}</span>
        <span style="font-size:0.85rem; color:var(--text-light);">${c.discount}% off</span>
      </div>
      <div style="display:flex; align-items:center; gap:8px;">
        <label style="display:flex; align-items:center; gap:4px; cursor:pointer; font-size:0.8rem; color:var(--text-muted);">
          <input type="checkbox" ${c.active !== false ? 'checked' : ''} onchange="togglePromoCode(${i}, this.checked)" style="accent-color:var(--rose);" />
          Active
        </label>
        <button type="button" onclick="deletePromoCode(${i})" style="background:none; border:none; cursor:pointer; color:var(--text-muted); font-size:1.1rem; padding:4px;" title="Delete code">&times;</button>
      </div>
    </div>
  `).join('');
}

window.togglePromoCode = function(index, active) {
  const codes = window.storeSettings.promoCodes || [];
  if (codes[index]) {
    codes[index].active = active;
    renderPromoCodes();
  }
};

window.deletePromoCode = function(index) {
  const codes = window.storeSettings.promoCodes || [];
  codes.splice(index, 1);
  window.storeSettings.promoCodes = codes;
  renderPromoCodes();
};

function initPromoCodeManager() {
  const addBtn = document.getElementById('promo-add-btn');
  const saveBtn = document.getElementById('save-promos-btn');
  if (!addBtn) return;

  addBtn.addEventListener('click', () => {
    const codeInput = document.getElementById('promo-new-code');
    const discountInput = document.getElementById('promo-new-discount');
    const code = codeInput.value.trim().toUpperCase();
    const discount = parseInt(discountInput.value);

    if (!code) { showToast('Please enter a promo code name', 'error'); return; }
    if (!discount || discount < 1 || discount > 100) { showToast('Discount must be between 1 and 100', 'error'); return; }

    const codes = window.storeSettings.promoCodes || [];
    if (codes.some(c => c.code === code)) {
      showToast(`Code "${code}" already exists`, 'error');
      return;
    }

    codes.push({ code, discount, active: true });
    window.storeSettings.promoCodes = codes;
    renderPromoCodes();

    codeInput.value = '';
    discountInput.value = '';
    showToast(`Promo code "${code}" added`, 'success');
  });

  if (saveBtn) {
    saveBtn.addEventListener('click', async () => {
      const ogText = saveBtn.textContent;
      saveBtn.textContent = 'Saving...';
      saveBtn.disabled = true;

      const data = { promoCodes: window.storeSettings.promoCodes || [] };

      // Merge into full settings
      const fullSettings = { ...window.storeSettings, ...data };
      localStorage.setItem('lueur_store_settings', JSON.stringify(fullSettings));
      window.storeSettings = fullSettings;

      let savedToFirestore = false;
      if (typeof window.firestoreSetDoc === 'function') {
        try {
          await window.firestoreSetDoc('settings', 'store_settings', fullSettings);
          savedToFirestore = true;
        } catch (err) {
          console.warn('Firestore save promo codes failed:', err);
        }
      }

      showToast(
        savedToFirestore ? '✅ Promo codes saved to Firestore.' : '✅ Promo codes saved locally.',
        'success'
      );

      saveBtn.textContent = ogText;
      saveBtn.disabled = false;
    });
  }
}

window.exportOrdersToCSV = function() {
  if (!dashOrders.length) { showToast('No orders to export', 'error'); return; }
  const headers = ['Order ID', 'Date', 'Customer', 'Items', 'Total', 'Status', 'Promo Code'];
  const rows = dashOrders.map(o => {
    const dateStr = o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleString() : 'Unknown';
    const items = o.items ? o.items.map(i => `${i.name} (${i.qty})`).join('; ') : '';
    return `"${o.id}","${dateStr}","${o.customerEmail||'Guest'}","${items}","${o.total}","${o.status}","${o.promoCode||''}"`;
  });
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lueur_orders_export_${new Date().getTime()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Orders exported to CSV', 'success');
};

window.generateSalesReport = function() {
  const revenue = dashOrders.reduce((s, o) => s + (parseFloat(o.total) || 0), 0);
  const text = `
LUEUR BEAUTY - SALES REPORT
Generated on: ${new Date().toLocaleString()}
-----------------------------------
Total Orders: ${dashOrders.length}
Total Revenue: $${formatPrice(revenue)}
Total Products in Inventory: ${dashProducts.length}

Delivered Orders: ${dashOrders.filter(o => o.status === 'Delivered').length}
Pending Orders: ${dashOrders.filter(o => o.status === 'Pending').length}
Cancelled Orders: ${dashOrders.filter(o => o.status === 'Cancelled').length}
-----------------------------------
End of Report
  `.trim();
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `lueur_sales_report_${new Date().getTime()}.txt`;
  a.click();
  URL.revokeObjectURL(url);
  showToast('Sales Report generated', 'success');
};

async function updateOrderStatus(orderId, newStatus) {
  if (typeof window.firestoreUpdateDoc !== 'function') return;
  try {
    const updateData = { status: newStatus };
    const order = dashOrders.find(o => String(o.id) === String(orderId));
    
    // Automatically mark COD orders as Paid when Delivered
    if (newStatus === 'Delivered' && order && order.paymentMethod === 'COD' && order.paymentStatus !== 'Paid') {
      updateData.paymentStatus = 'Paid';
    }

    await window.firestoreUpdateDoc('orders', String(orderId), updateData);
    
    if (order) {
      order.status = newStatus;
      if (updateData.paymentStatus) {
        order.paymentStatus = updateData.paymentStatus;
      }
    }
    showToast('Order status updated', 'success');
    renderDashOrders(); // Re-render to show updated payment status
  } catch (err) {
    console.error('Update status failed:', err);
    showToast('Failed to update status', 'error');
    renderDashOrders(); // Revert visually
  }
}

function openProductModal(id = null) {
  const modal = document.getElementById('product-modal');
  const title = document.getElementById('modal-title');
  const idInput = document.getElementById('form-product-id');
  const form = document.getElementById('modal-product-form');
  const preview = document.getElementById('form-image-preview');
  form.reset();
  if (preview) preview.innerHTML = '';
  if (id) {
    const p = dashProducts.find(x => String(x.id) === String(id));
    if (!p) return;
    title.textContent = 'Edit Product';
    idInput.value = p.id;
    document.getElementById('form-name').value = p.name;
    document.getElementById('form-category').value = p.category;
    document.getElementById('form-mrp').value = p.mrp || p.oldPrice || '';
    document.getElementById('form-discount').value = p.discount || '';
    document.getElementById('form-price').value = p.price;
    document.getElementById('form-stock').value = p.stock;
    document.getElementById('form-desc').value = p.desc || '';
    // Show existing image preview
    if (preview && p.image) {
      preview.innerHTML = `<img src="${p.image}" alt="Current" style="max-width:100%;max-height:120px;border-radius:4px;border:1px solid var(--border);object-fit:cover;">`;
    }
  } else {
    title.textContent = 'Add New Product';
    idInput.value = '';
  }
  modal.classList.add('active');
}

function closeProductModal() {
  document.getElementById('product-modal')?.classList.remove('active');
  document.getElementById('modal-product-form')?.reset();
  const preview = document.getElementById('form-image-preview');
  if (preview) preview.innerHTML = '';
}

async function handleProductFormSubmit(e) {
  e.preventDefault();
  const id = document.getElementById('form-product-id').value;
  const name = document.getElementById('form-name').value.trim();
  const category = document.getElementById('form-category').value;
  const mrpVal = parseFloat(document.getElementById('form-mrp').value);
  const discountVal = parseFloat(document.getElementById('form-discount').value);
  const price = parseFloat(document.getElementById('form-price').value);
  const stock = parseInt(document.getElementById('form-stock').value);
  const desc = document.getElementById('form-desc').value.trim();
  const fileInput = document.getElementById('form-image');
  const file = fileInput?.files[0] || null;

  if (!name || isNaN(price) || isNaN(stock)) { showToast('Please fill all required fields', 'error'); return; }

  const mrp = isNaN(mrpVal) ? null : mrpVal;
  const discount = isNaN(discountVal) ? null : discountVal;
  const oldPrice = mrp; // Sync oldPrice

  // Show loading state
  const submitBtn = e.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Saving…';

  try {
    // Build product data for Firestore
    const productData = { name, category, price, stock, desc, mrp, discount, oldPrice };

    // Do not use Firebase Storage. Keep Firestore-only architecture.
    // If a local image file is selected, set image field to empty string 
    // so it falls back to the default UI placeholder instead of saving a broken local filename.
     if (file) {
    submitBtn.textContent = 'Uploading image...';

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'lueur_products');

    const response = await fetch(
        'https://api.cloudinary.com/v1_1/dgsuollyy/image/upload',
        {
            method: 'POST',
            body: formData
        }
    );

    const data = await response.json();

    if (data.secure_url) {
        productData.image = data.secure_url;
    } else {
        throw new Error('Cloudinary upload failed');
    }
}

    if (id) {
      // ── UPDATE ──
      const existing = dashProducts.find(x => String(x.id) === String(id));
      if (existing) {
        Object.assign(existing, productData);
        
        // Immediately update in-memory objects so cart and products page reflect updates instantly
        const memProduct = PRODUCTS.find(x => String(x.id) === String(id));
        if (memProduct) Object.assign(memProduct, productData);
        
        if (window.__productsCache) {
          const cacheProduct = window.__productsCache.find(x => String(x.id) === String(id));
          if (cacheProduct) Object.assign(cacheProduct, productData);
        }
      }
      // Try Firestore update
      if (typeof window.firestoreUpdateDoc === 'function') {
        try {
          submitBtn.textContent = 'Saving to database…';
          await window.firestoreUpdateDoc('products', String(id), productData);
        } catch (err) { console.warn('Firestore update failed:', err); }
      }
      showToast('Product updated successfully', 'success');
    } else {
      // ── ADD NEW ──
      const newProduct = { ...productData, emoji: '🌸', featured: false };

      // Try Firestore add
      if (typeof window.firestoreAddDoc === 'function') {
        try {
          submitBtn.textContent = 'Saving to database…';
          const docRef = await window.firestoreAddDoc('products', productData);
          newProduct.id = docRef.id;
        } catch (err) {
          console.warn('Firestore add failed, using local ID:', err);
          newProduct.id = Date.now();
        }
      } else {
        newProduct.id = Date.now();
      }

      dashProducts.push(newProduct);
      showToast('Product added successfully', 'success');
    }

    saveDashProducts();
    renderAllDashboardViews();
    closeProductModal();

  } catch (err) {
    console.error('Save failed:', err);
    showToast('Failed to save product. Please try again.', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

async function deleteProduct(id) {
  if (!confirm('Delete this product? This cannot be undone.')) return;
  dashProducts = dashProducts.filter(p => String(p.id) !== String(id));
  saveDashProducts();
  renderAllDashboardViews();

  // Try Firestore delete
  if (typeof window.firestoreDeleteDoc === 'function') {
    try {
      await window.firestoreDeleteDoc('products', String(id));
    } catch (err) { console.warn('Firestore delete failed:', err); }
  }

  showToast('Product deleted', 'info');
}

/* ===== SCROLL ANIMATIONS ===== */
function initScrollAnimations() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.style.opacity = '1'; e.target.style.transform = 'translateY(0)'; } });
  }, { threshold: 0.1 });
  document.querySelectorAll('.product-card, .review-card, .ingredient-item, .stat-card, .contact-item').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity .5s ease, transform .5s ease';
    observer.observe(el);
  });
}

/* ===== CONTACT FORM ===== */
function initContactForm() {
  const form = document.getElementById('contact-form');
  if (!form) return;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name = document.getElementById('c-name').value.trim();
    const email = document.getElementById('c-email').value.trim();
    const subject = document.getElementById('c-subject').value;
    const message = document.getElementById('c-message').value.trim();
    const data = { name, email, subject, message, timestamp: Date.now() };
    try {
      if (typeof window.firestoreAddDoc === 'function') {
        await window.firestoreAddDoc('messages', data);
      }
      showToast('Message sent – seller will see it in the dashboard', 'success');
    } catch (err) {
      console.warn('Failed to save message:', err);
      showToast('Message sent – will appear later', 'info');
    }
    form.reset();
  });
}

/* ===== CUSTOMER ORDERS PAGE ===== */
async function initOrdersPage() {
  const loadingEl = document.getElementById('orders-loading');
  const emptyEl = document.getElementById('orders-empty');
  const listEl = document.getElementById('orders-list');
  if (!listEl) return;

  try {
    if (typeof window.firestoreGetDocs !== 'function') {
      throw new Error('Firestore not available');
    }
    const snapshot = await window.firestoreGetDocs('orders');
    const allOrders = [];
    snapshot.forEach(docSnap => {
      allOrders.push({ id: docSnap.id, ...docSnap.data() });
    });

    // Determine current user identifier for filtering
    let filterFn = () => false; // default: show nothing
    if (window.auth && window.auth.currentUser && window.auth.currentUser.email) {
      const userEmail = window.auth.currentUser.email;
      filterFn = order => order.customerEmail === userEmail;
    } else {
      // Guest / anonymous user – use stored anon ID
      const anonId = localStorage.getItem('lueur_anon_id');
      if (anonId) {
        filterFn = order => order.customerId === anonId;
      }
    }
    const orders = allOrders.filter(filterFn);

    // Fetch existing reviews to check duplicates
    const userReviews = [];
    try {
      if (typeof window.firestoreGetReviews === 'function') {
        const revSnap = await window.firestoreGetReviews();
        revSnap.forEach(d => {
          userReviews.push({ id: d.id, ...d.data() });
        });
      }
    } catch(e) {
      console.warn('Failed to load reviews:', e);
    }

    // Sort newest first
    orders.sort((a, b) => {
      const timeA = a.createdAt?.seconds || (typeof a.createdAt === 'number' ? a.createdAt / 1000 : 0);
      const timeB = b.createdAt?.seconds || (typeof b.createdAt === 'number' ? b.createdAt / 1000 : 0);
      return timeB - timeA;
    });

    if (loadingEl) loadingEl.style.display = 'none';

    if (orders.length === 0) {
      if (emptyEl) emptyEl.style.display = 'block';
      return;
    }

    listEl.style.display = 'block';
    listEl.innerHTML = orders.map(order => renderOrderCard(order, userReviews)).join('');

  } catch (err) {
    console.error('Failed to load orders:', err);
    if (loadingEl) loadingEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
  }
}

function renderOrderCard(order, userReviews = []) {
  const orderId = order.id.slice(0, 6).toUpperCase();

  // Format date
  let dateStr = 'Unknown date';
  if (order.createdAt && order.createdAt.seconds) {
    const d = new Date(order.createdAt.seconds * 1000);
    dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  } else if (order.createdAt) {
    const d = new Date(order.createdAt);
    dateStr = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Items list
  const items = order.items && Array.isArray(order.items) ? order.items : [];
  const itemsHTML = items.map(i => {
    const price = parseFloat(i.price) || 0;
    const safeName = (i.name || 'Unknown').replace(/'/g, "\\'");
    
    let reviewBtnHTML = '';
    if (order.status === 'Delivered') {
      const alreadyReviewed = userReviews.some(r =>
        String(r.orderId) === String(order.id) && String(r.productId) === String(i.id)
      );
      if (alreadyReviewed) {
        reviewBtnHTML = `<span class="reviewed-badge">✓ Reviewed</span>`;
      } else {
        reviewBtnHTML = `<button class="btn-write-review" onclick="openReviewModal('${order.id}', '${i.id}', '${safeName}')">⭐ Write Review</button>`;
      }
    }

    return `
      <li>
        <span class="item-name">${i.name || 'Unknown'}</span>
        <span class="item-qty">× ${i.qty || 1}</span>
        <div style="display: flex; align-items: center; gap: 8px;">
          <span class="item-price">$${formatPrice(price * (i.qty || 1))}</span>
          ${reviewBtnHTML}
        </div>
      </li>`;
  }).join('');

  // Total
  const total = parseFloat(order.total) || 0;

  // Status badge — using semantic pill classes
  const status = order.status || 'Pending';
  const statusBadgeClass = {
    'Pending':    'badge-status-pending',
    'Processing': 'badge-status-processing',
    'Shipped':    'badge-status-shipped',
    'Delivered':  'badge-status-delivered',
    'Cancelled':  'badge-status-cancelled',
  }[status] || 'badge-status-pending';
  const statusEmoji = {
    'Pending':    '🕐',
    'Processing': '⚙️',
    'Shipped':    '📦',
    'Delivered':  '✅',
    'Cancelled':  '❌',
  }[status] || '🕐';

  // Promo tag
  const promoHTML = order.promoCode
    ? `<span class="order-promo-tag">🏷️ ${order.promoCode}</span>`
    : '';

  // Cancel button — only for Pending or Processing
  const canCancel = status === 'Pending' || status === 'Processing';
  const cancelHTML = canCancel
    ? `<button class="btn-cancel-order" onclick="cancelCustomerOrder('${order.id}', this)">Cancel Order</button>`
    : '';

  return `
    <div class="order-card" id="order-${order.id}">
      <div class="order-card-header">
        <div>
          <span class="order-id">#LB-${orderId}</span>
          ${promoHTML}
        </div>
        <span class="order-date">${dateStr}</span>
      </div>
      <div class="order-card-body">
        <ul class="order-items-list">${itemsHTML}</ul>
        <div style="margin-top: 12px; padding-top: 10px; border-top: 1px dashed var(--border); display: flex; justify-content: space-between; font-size: 0.82rem; color: var(--text-light); flex-wrap: wrap; gap: 8px;">
          <span>Payment Method: <strong>${order.paymentMethod || 'COD'}</strong>${order.razorpayPaymentId ? ` (${order.razorpayPaymentId})` : ''}</span>
          <span>Payment Status: <strong>${order.paymentStatus || 'Pending'}</strong></span>
        </div>
      </div>
      <div class="order-card-footer">
        <div class="order-total">Total: <span>$${formatPrice(total)}</span></div>
        <div class="order-actions">
          <span class="${statusBadgeClass}">${statusEmoji} ${status}</span>
          ${cancelHTML}
        </div>
      </div>
    </div>`;
}

async function cancelCustomerOrder(orderId, btnEl) {
  if (!confirm('Are you sure you want to cancel this order?')) return;

  const originalText = btnEl.textContent;
  btnEl.disabled = true;
  btnEl.textContent = 'Cancelling…';

  try {
    if (typeof window.firestoreUpdateDoc !== 'function') {
      throw new Error('Firestore not available');
    }
    await window.firestoreUpdateDoc('orders', String(orderId), { status: 'Cancelled' });
    showToast('Order cancelled successfully', 'info');

    // Re-render just the cancelled card
    const cardEl = document.getElementById(`order-${orderId}`);
    if (cardEl) {
      // Update the badge
      const badgeEl = cardEl.querySelector('.order-actions .badge');
      if (badgeEl) {
        badgeEl.className = 'badge badge-red';
        badgeEl.textContent = 'Cancelled';
      }
      // Remove cancel button
      btnEl.remove();
    }
  } catch (err) {
    console.error('Cancel order failed:', err);
    showToast('Failed to cancel order. Please try again.', 'error');
    btnEl.disabled = false;
    btnEl.textContent = originalText;
  }
}

/* ===== REVIEWS HELPERS ===== */
let selectedRatingValue = 0;
let currentReviewContext = null;

window.openReviewModal = (orderId, productId, productName) => {
  const modal = document.getElementById('review-modal');
  if (!modal) return;

  currentReviewContext = { orderId, productId };

  document.getElementById('review-product-name').value = productName;
  document.getElementById('review-comment-text').value = '';
  selectedRatingValue = 0;

  const ratingLabel = document.getElementById('rating-label-text');
  if (ratingLabel) {
    ratingLabel.textContent = 'Select a rating';
    ratingLabel.style.color = 'var(--text-muted)';
  }

  document.querySelectorAll('#star-rating-selector .star').forEach(star => {
    star.style.color = '#e0e0e0';
  });

  modal.classList.add('active');
};

window.closeReviewModal = () => {
  const modal = document.getElementById('review-modal');
  if (modal) {
    modal.classList.remove('active');
  }
  currentReviewContext = null;
};

/* ===== PRODUCT DETAIL PAGE ===== */
async function initProductPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get('id');

  const loadingEl = document.getElementById('product-loading');
  const errorEl = document.getElementById('product-error');
  const contentEl = document.getElementById('product-content');

  if (!id) {
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'block';
    return;
  }

  let product = null;

  try {
    // Check Firestore
    if (typeof window.firestoreGetDoc === 'function') {
      const docSnap = await window.firestoreGetDoc('products', String(id));
      if (docSnap.exists()) {
        product = { id: docSnap.id, ...docSnap.data() };
        // Cache it
        window.__productsCache = window.__productsCache || [];
        if (!window.__productsCache.find(p => String(p.id) === String(product.id))) {
          window.__productsCache.push(product);
        }
      }
    }

    // Check Hardcoded if not found in Firestore
    if (!product) {
      product = PRODUCTS.find(p => String(p.id) === String(id));
    }

    if (!product) {
      throw new Error('Product not found');
    }

    // Render Data
    const price = parseFloat(product.price) || 0;
    const mrpVal = product.mrp || product.oldPrice;
    const oldPrice = mrpVal ? parseFloat(mrpVal) : null;
    const stock = typeof product.stock !== 'undefined' ? parseInt(product.stock) : 10;
    const isOutOfStock = stock <= 0;

    const imgBox = document.getElementById('detail-image-box');
    if (imgBox) {
      imgBox.innerHTML = (product.image && typeof product.image === 'string' && product.image.trim() !== '')
        ? `<img src="${product.image}" alt="${product.name}" onerror="this.onerror=null; this.outerHTML='<div class=\\'product-image-placeholder\\'>${product.emoji || '🌸'}</div>';">`
        : `<div class="product-image-placeholder">${product.emoji || '🌸'}</div>`;
    }

    document.getElementById('detail-category').textContent = product.category || '';
    document.getElementById('detail-name').textContent = product.name || '';
    document.getElementById('detail-desc').textContent = product.desc || '';

    document.getElementById('detail-price').textContent = `$${formatPrice(price)}`;
    if (oldPrice) {
      document.getElementById('detail-old-price').textContent = `$${formatPrice(oldPrice)}`;
      if (product.discount) {
        const discBadge = document.createElement('span');
        discBadge.className = 'product-badge';
        discBadge.style.marginLeft = '8px';
        discBadge.style.position = 'static';
        discBadge.style.display = 'inline-block';
        discBadge.textContent = `${product.discount}% OFF`;
        document.getElementById('detail-old-price').after(discBadge);
      }
    }

    const badge = document.getElementById('detail-stock-badge');
    if (badge) {
      if (isOutOfStock) {
        badge.textContent = 'Out of Stock';
        badge.className = 'stock-badge out';
      } else {
        badge.textContent = 'In Stock';
        badge.className = 'stock-badge';
      }
    }

    const addBtn = document.getElementById('detail-add-btn');
    if (addBtn) {
      if (isOutOfStock) {
        addBtn.disabled = true;
        addBtn.textContent = 'Out of Stock';
      } else {
        addBtn.onclick = () => addToCart(product.id);
      }
    }

    const wishBtn = document.getElementById('detail-wishlist-btn');
    if (wishBtn) {
      const inWishlist = typeof wishlist !== 'undefined' && wishlist.find(x => String(x.id) === String(product.id));
      if (inWishlist) {
        wishBtn.textContent = '♥ Wishlisted';
        wishBtn.style.color = 'var(--rose)';
      }
      wishBtn.onclick = () => {
        addToWishlist(product.id);
        wishBtn.textContent = '♥ Wishlisted';
        wishBtn.style.color = 'var(--rose)';
      };
    }

    if (loadingEl) loadingEl.style.display = 'none';
    if (contentEl) contentEl.style.display = 'block';

    // Fetch and calculate average rating and render reviews list
    const ratingSummaryEl = document.getElementById('detail-rating-summary');
    const reviewsContainerEl = document.getElementById('reviews-container');

    if (ratingSummaryEl || reviewsContainerEl) {
      let productReviews = [];
      try {
        if (typeof window.firestoreGetReviews === 'function') {
          const revSnap = await window.firestoreGetReviews();
          revSnap.forEach(d => {
            const data = d.data();
            if (String(data.productId) === String(product.id)) {
              productReviews.push({ id: d.id, ...data });
            }
          });
        }
      } catch (e) {
        console.warn('Failed to load reviews for product:', e);
      }

      // Sort newest first
      productReviews.sort((a, b) => {
        const timeA = a.createdAt?.seconds || (typeof a.createdAt === 'number' ? a.createdAt / 1000 : 0);
        const timeB = b.createdAt?.seconds || (typeof b.createdAt === 'number' ? b.createdAt / 1000 : 0);
        return timeB - timeA;
      });

      // Calculate average rating
      if (ratingSummaryEl) {
        if (productReviews.length > 0) {
          const totalRating = productReviews.reduce((sum, r) => sum + (parseInt(r.rating) || 0), 0);
          const avgRating = (totalRating / productReviews.length).toFixed(1);
          ratingSummaryEl.innerHTML = `
            <span class="rating-summary-pill">
              <span style="color:#FFD700;font-size:1rem;">★</span>
              <span class="rating-avg">${avgRating} / 5</span>
              <span class="rating-count">(${productReviews.length} Review${productReviews.length !== 1 ? 's' : ''})</span>
            </span>
          `;
        } else {
          ratingSummaryEl.innerHTML = `<span style="color:var(--text-light);font-size:.85rem;">No reviews yet</span>`;
        }
      }

      // Render reviews list
      if (reviewsContainerEl) {
        if (productReviews.length > 0) {
          reviewsContainerEl.innerHTML = productReviews.map(r => {
            let dateStr = '';
            if (r.createdAt && r.createdAt.seconds) {
              dateStr = new Date(r.createdAt.seconds * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            } else if (r.createdAt) {
              dateStr = new Date(r.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
            }

            const starsHTML = Array.from({ length: 5 }, (_, idx) =>
              `<span style="color:${idx < (parseInt(r.rating) || 0) ? '#FFD700' : '#e0e0e0'}">★</span>`
            ).join('');

            const safeReview = (r.review || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');

            return `
              <div class="review-item">
                <div class="review-item-header">
                  <span class="review-item-author">${r.customerName || 'Anonymous'}</span>
                  ${dateStr ? `<span class="review-item-date">${dateStr}</span>` : ''}
                </div>
                <div class="review-item-stars">${starsHTML}</div>
                <p class="review-item-text">${safeReview}</p>
              </div>`;
          }).join('');
        } else {
          reviewsContainerEl.innerHTML = `<p class="reviews-empty-state">Be the first to review this product.</p>`;
        }
      }
    }

    // Fetch related products
    let related = PRODUCTS.filter(p => p.category === product.category && String(p.id) !== String(product.id));

    if (typeof window.firestoreGetDocs === 'function') {
      try {
        const snap = await window.firestoreGetDocs('products');
        snap.forEach(d => {
          const p = { id: d.id, ...d.data() };
          if (p.category === product.category && String(p.id) !== String(product.id)) {
            // Avoid duplicates
            if (!related.find(r => r.name === p.name)) related.push(p);
          }
        });
      } catch (e) { }
    }

    const relatedGrid = document.getElementById('related-grid');
    if (relatedGrid) {
      if (related.length > 0) {
        relatedGrid.innerHTML = related.slice(0, 4).map(p => productCardHTML(p)).join('');
      } else {
        relatedGrid.innerHTML = '<p style="color:var(--text-light)">No related products found.</p>';
      }
    }

  } catch (err) {
    console.warn('Product load error:', err);
    if (loadingEl) loadingEl.style.display = 'none';
    if (errorEl) errorEl.style.display = 'block';
  }
}

/* ===== WISHLIST PAGE ===== */
function initWishlistPage() {
  const container = document.getElementById('wishlist-items-container');
  const emptyEl = document.getElementById('wishlist-empty');
  const layoutEl = document.getElementById('wishlist-layout');

  if (!container) return;

  if (wishlist.length === 0) {
    container.innerHTML = '';
    if (layoutEl) layoutEl.style.display = 'none';
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }

  if (emptyEl) emptyEl.style.display = 'none';
  if (layoutEl) layoutEl.style.display = 'block';

  container.innerHTML = wishlist.map(item => {
    const stock = typeof item.stock !== 'undefined' ? parseInt(item.stock) : 10;
    const isOutOfStock = stock <= 0;
    const imgHTML = (item.image && typeof item.image === 'string' && item.image.trim() !== '')
      ? `<img src="${item.image}" alt="${item.name}" class="cart-item-img" onerror="this.onerror=null; this.outerHTML='<div class=\\'cart-item-img-placeholder\\'>${item.emoji || '🌸'}</div>';">`
      : `<div class="cart-item-img-placeholder">${item.emoji || '🌸'}</div>`;

    let moveBtnHTML = `<button class="btn btn-outline-dark btn-sm" onclick="moveToCartFromWishlist('${item.id}')">Move To Cart</button>`;
    if (isOutOfStock) {
      moveBtnHTML = `<button class="btn btn-outline btn-sm" disabled>Out of Stock</button>`;
    }

    return `
      <div class="cart-item" id="wishlist-item-${item.id}">
        <a href="product.html?id=${item.id}" style="display:block;text-decoration:none;color:inherit;">
          ${imgHTML}
        </a>
        <div class="cart-item-info">
          <div class="product-category">${item.category || ''}</div>
          <a href="product.html?id=${item.id}" style="text-decoration:none;color:inherit;">
            <h4>${item.name}</h4>
          </a>
          <p>$${formatPrice(item.price)}</p>
        </div>
        <div class="cart-item-price">
          ${moveBtnHTML}
          <button class="remove-btn" onclick="removeFromWishlist('${item.id}')" title="Remove from wishlist">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>
            Remove
          </button>
        </div>
      </div>`;
  }).join('');
}

async function initGlobalStoreSettings() {
  try {
    const cached = localStorage.getItem('lueur_store_settings');
    if (cached) {
      const parsed = JSON.parse(cached);
      window.storeSettings = { ...window.storeSettings, ...parsed };
    }
  } catch (e) {
    console.warn('Failed to parse cached settings:', e);
  }

  if (typeof window.firestoreGetDoc === 'function') {
    try {
      const docSnap = await window.firestoreGetDoc('settings', 'store_settings');
      if (docSnap.exists()) {
        const firestoreData = docSnap.data();
        window.storeSettings = { ...window.storeSettings, ...firestoreData };
        localStorage.setItem('lueur_store_settings', JSON.stringify(window.storeSettings));
      }
    } catch (err) {
      console.warn('Failed to fetch settings from Firestore:', err);
    }
  }

  renderFooterContactDetails();

  const path = window.location.pathname.split('/').pop() || 'index.html';
  if (path === 'index.html' || path === '') {
    updateAnnouncementBar();
    renderHomepageContactDetails();
  }

  if (path === 'cart.html') {
    renderCartPage();
  }
}

function renderFooterContactDetails() {
  const footerBrand = document.querySelector('footer .footer-brand');
  if (!footerBrand) return;

  let contactDiv = document.getElementById('footer-contact-info');
  if (!contactDiv) {
    contactDiv = document.createElement('div');
    contactDiv.id = 'footer-contact-info';
    contactDiv.className = 'footer-contact-info';
    contactDiv.style.marginTop = '15px';
    contactDiv.style.fontSize = '0.82rem';
    contactDiv.style.color = 'var(--text-light)';
    contactDiv.style.display = 'flex';
    contactDiv.style.flexDirection = 'column';
    contactDiv.style.gap = '6px';
    footerBrand.appendChild(contactDiv);
  }

  const email = window.storeSettings.storeEmail || 'hello@lueurbeauty.com';
  const phone = window.storeSettings.storePhone || '+1 (800) 583-7829';
  const address = window.storeSettings.storeAddress || '123 Rose Lane, Beverly Hills, CA 90210';

  contactDiv.innerHTML = `
    <span style="display:flex;align-items:center;gap:6px;">
      <span style="font-size:0.9rem;">✉️</span> <a href="mailto:${email}" style="color:inherit;text-decoration:none;">${email}</a>
    </span>
    <span style="display:flex;align-items:center;gap:6px;">
      <span style="font-size:0.9rem;">📞</span> <a href="tel:${phone}" style="color:inherit;text-decoration:none;">${phone}</a>
    </span>
    <span style="display:flex;align-items:center;gap:6px;">
      <span style="font-size:0.9rem;">📍</span> <span>${address}</span>
    </span>
  `;
}

function updateAnnouncementBar() {
  const bar = document.querySelector('.announcement-bar p');
  if (!bar) return;
  const threshold = parseFloat(window.storeSettings.freeShippingThreshold) || 50;
  const thresholdFormatted = threshold % 1 === 0 ? threshold : formatPrice(threshold);

  // Build promo code display from active codes
  const codes = (window.storeSettings.promoCodes || []).filter(c => c.active !== false);
  let promoText = '';
  if (codes.length === 1) {
    promoText = `Code <strong>${codes[0].code}</strong> for ${codes[0].discount}% off`;
  } else if (codes.length > 1) {
    promoText = codes.map(c => `<strong>${c.code}</strong> (${c.discount}%)`).join(' · ');
  }

  if (promoText) {
    bar.innerHTML = `Complimentary shipping on orders over $${thresholdFormatted} &nbsp;|&nbsp; ${promoText}`;
  } else {
    bar.innerHTML = `Complimentary shipping on orders over $${thresholdFormatted}`;
  }
}

/* ===== PROMO CODE HELPERS ===== */
function getMatchedPromoCode(code) {
  if (!code) return null;
  const codes = window.storeSettings.promoCodes || [];
  return codes.find(c => c.code === code.toUpperCase() && c.active !== false) || null;
}

function renderHomepageContactDetails() {
  const emailVal = window.storeSettings.storeEmail || 'hello@lueurbeauty.com';
  const phoneVal = window.storeSettings.storePhone || '+1 (800) 583-7829';
  const addressVal = window.storeSettings.storeAddress || '123 Rose Lane, Beverly Hills, CA 90210';

  const items = document.querySelectorAll('.contact-item');
  items.forEach(item => {
    const h4 = item.querySelector('h4');
    const p = item.querySelector('p');
    if (h4 && p) {
      const text = h4.textContent.trim().toLowerCase();
      if (text.includes('email')) {
        p.innerHTML = `<a href="mailto:${emailVal}" style="color:inherit;text-decoration:none;">${emailVal}</a>`;
      } else if (text.includes('call')) {
        p.innerHTML = `<a href="tel:${phoneVal}" style="color:inherit;text-decoration:none;">${phoneVal}</a>`;
      } else if (text.includes('visit')) {
        p.textContent = addressVal;
      }
    }
  });
}

/* ===== INIT ===== */
document.addEventListener('DOMContentLoaded', async () => {
  initNavbar();
  initAuthState();   // connect Firebase auth to navbar on every page
  initGlobalStoreSettings();

  // Review Modal star interaction setup
  const starContainer = document.getElementById('star-rating-selector');
  if (starContainer) {
    const stars = starContainer.querySelectorAll('.star');
    const ratingLabels = {
      1: 'Poor ⭐️',
      2: 'Fair ⭐️⭐️',
      3: 'Good ⭐️⭐️⭐️',
      4: 'Very Good ⭐️⭐️⭐️⭐️',
      5: 'Excellent ⭐️⭐️⭐️⭐️⭐️'
    };
    stars.forEach(star => {
      star.addEventListener('click', () => {
        const val = parseInt(star.getAttribute('data-value'));
        selectedRatingValue = val;
        stars.forEach(s => {
          const sVal = parseInt(s.getAttribute('data-value'));
          s.style.color = sVal <= val ? '#FFD700' : '#e0e0e0';
        });
        const labelText = document.getElementById('rating-label-text');
        if (labelText) {
          labelText.textContent = ratingLabels[val] || 'Select a rating';
          labelText.style.color = 'var(--text-body)';
        }
      });
    });
  }

  // Review Modal submit setup
  const submitReviewBtn = document.getElementById('btn-submit-review');
  if (submitReviewBtn) {
    submitReviewBtn.addEventListener('click', async () => {
      const comment = document.getElementById('review-comment-text').value.trim();
      if (!selectedRatingValue) {
        showToast('Please select a rating (1-5 stars)', 'error');
        return;
      }
      if (!comment) {
        showToast('Please write a review comment', 'error');
        return;
      }

      if (!currentReviewContext) {
        showToast('Review session expired. Please re-open the modal.', 'error');
        return;
      }

      submitReviewBtn.disabled = true;
      const originalText = submitReviewBtn.textContent;
      submitReviewBtn.textContent = 'Submitting...';

      try {
        if (typeof window.firestoreCreateReview !== 'function') {
          throw new Error('Firestore helper not available');
        }

        let customerName = 'Anonymous';
        if (window.auth && window.auth.currentUser) {
          const email = window.auth.currentUser.email || '';
          customerName = email.split('@')[0] || 'Anonymous';
        }

        await window.firestoreCreateReview(
          currentReviewContext.productId,
          currentReviewContext.orderId,
          selectedRatingValue,
          comment,
          customerName
        );

        showToast('Review submitted successfully!', 'success');
        closeReviewModal();

        // Refresh orders list to show ✓ Reviewed
        if (typeof initOrdersPage === 'function') {
          await initOrdersPage();
        }
      } catch (err) {
        console.error('Submit review failed:', err);
        showToast('Failed to submit review. Please try again.', 'error');
      } finally {
        submitReviewBtn.disabled = false;
        submitReviewBtn.textContent = originalText;
      }
    });
  }

  const page = window.location.pathname.split('/').pop() || 'index.html';
  if (page === 'index.html' || page === '') { initHomePage(); initContactForm(); }
  if (page === 'products.html' || page === 'products') initProductsPage();
   if (page === 'product.html' || page === 'product') initProductPage();
if (page === 'cart.html' || page === 'cart') initCartPage();
if (page === 'wishlist.html' || page === 'wishlist') initWishlistPage();
if (page === 'login.html' || page === 'login') initAuthPage();
if (page === 'dashboard.html' || page === 'dashboard') await initDashboard();
if (page === 'orders.html' || page === 'orders') initOrdersPage();
});
