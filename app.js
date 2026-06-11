// ============================================================
// app.js — Customer-facing JS (products, orders, contact)
// ============================================================

import {
  getAllProducts,
  placeOrder,
  submitContactMessage,
  listenToOrder,
} from "./firebase.js";

// ──────────────────────────────────────────────
// Navbar / Hamburger
// ──────────────────────────────────────────────
const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("nav-menu");

if (hamburger && navMenu) {
  hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("open");
    hamburger.classList.toggle("active");
  });
  // Close on nav link click
  navMenu.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      navMenu.classList.remove("open");
      hamburger.classList.remove("active");
    })
  );
}

// ──────────────────────────────────────────────
// Loading overlay helpers
// ──────────────────────────────────────────────
function showLoader() {
  document.getElementById("page-loader")?.classList.remove("hidden");
}
function hideLoader() {
  document.getElementById("page-loader")?.classList.add("hidden");
}

// ──────────────────────────────────────────────
// Cart (session storage)
// ──────────────────────────────────────────────
function getCart() {
  return JSON.parse(sessionStorage.getItem("sf_cart") || "[]");
}
function saveCart(cart) {
  sessionStorage.setItem("sf_cart", JSON.stringify(cart));
  updateCartBadge();
}
function updateCartBadge() {
  const cart = getCart();
  const total = cart.reduce((s, i) => s + i.qty, 0);
  document.querySelectorAll(".cart-badge").forEach((b) => {
    b.textContent = total;
    b.style.display = total ? "flex" : "none";
  });
}
function addToCart(product) {
  const cart = getCart();
  const idx = cart.findIndex((i) => i.docId === product.docId);
  if (idx > -1) cart[idx].qty += 1;
  else cart.push({ ...product, qty: 1 });
  saveCart(cart);
  showToast(`${product.name} added to cart!`);
}

// ──────────────────────────────────────────────
// Toast notification
// ──────────────────────────────────────────────
function showToast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => {
    t.classList.remove("show");
    setTimeout(() => t.remove(), 400);
  }, 3200);
}

// ──────────────────────────────────────────────
// Products Page
// ──────────────────────────────────────────────
const productsGrid = document.getElementById("products-grid");
const searchInput = document.getElementById("search-input");
const categoryBtns = document.querySelectorAll(".cat-btn");

let allProducts = [];
let activeCategory = "All";
let searchTerm = "";

// Fallback demo products (shown before Firebase loads or if empty)
const DEMO_PRODUCTS = [
  { docId: "d1", name: "Spicy Chicken Biryani", category: "Rice", price: 220, description: "Aromatic basmati rice layered with tender spiced chicken and caramelised onions.", emoji: "🍚" },
  { docId: "d2", name: "Paneer Tikka Masala", category: "Curry", price: 180, description: "Smoky grilled paneer simmered in a rich tomato-cream gravy.", emoji: "🍛" },
  { docId: "d3", name: "Crispy Veg Burger", category: "Burgers", price: 120, description: "Golden patty with fresh lettuce, tomato and our house burger sauce.", emoji: "🍔" },
  { docId: "d4", name: "Margherita Pizza", category: "Pizza", price: 250, description: "Thin crust topped with San Marzano tomato, fresh mozzarella and basil.", emoji: "🍕" },
  { docId: "d5", name: "Grilled Fish Tacos", category: "Snacks", price: 160, description: "Corn tortillas loaded with grilled fish, cabbage slaw and chipotle mayo.", emoji: "🌮" },
  { docId: "d6", name: "Masala Dosa", category: "Breakfast", price: 90, description: "Crisp rice-lentil crepe filled with spiced potato, served with sambar & chutney.", emoji: "🥞" },
  { docId: "d7", name: "Chocolate Lava Cake", category: "Desserts", price: 140, description: "Warm molten chocolate centre with a dusting of powdered sugar and vanilla ice cream.", emoji: "🍫" },
  { docId: "d8", name: "Fresh Mango Lassi", category: "Drinks", price: 80, description: "Thick creamy yoghurt blended with Alphonso mangoes and a hint of cardamom.", emoji: "🥭" },
  { docId: "d9", name: "Butter Naan Basket", category: "Breads", price: 60, description: "Soft pillowy naan brushed with butter and garlic, baked in a tandoor oven.", emoji: "🫓" },
  { docId: "d10", name: "Peri-Peri Fries", category: "Snacks", price: 100, description: "Thick-cut fries tossed in fiery peri-peri seasoning with a cool mint dip.", emoji: "🍟" },
];

async function loadProducts() {
  if (!productsGrid) return;
  showLoader();
  try {
    const fetched = await getAllProducts();
    allProducts = fetched.length ? fetched : DEMO_PRODUCTS;
  } catch {
    allProducts = DEMO_PRODUCTS;
  }
  hideLoader();
  renderProducts();
}

function renderProducts() {
  if (!productsGrid) return;
  const filtered = allProducts.filter((p) => {
    const matchCat = activeCategory === "All" || p.category === activeCategory;
    const matchSearch =
      !searchTerm ||
      p.name.toLowerCase().includes(searchTerm) ||
      p.description.toLowerCase().includes(searchTerm);
    return matchCat && matchSearch;
  });

  if (!filtered.length) {
    productsGrid.innerHTML = `<div class="no-results"><span>🍽️</span><p>No dishes found. Try a different search!</p></div>`;
    return;
  }

  productsGrid.innerHTML = filtered
    .map(
      (p) => `
    <div class="product-card" data-id="${p.docId}">
      <div class="product-img">
        ${p.imageUrl ? `<img src="${p.imageUrl}" alt="${p.name}" loading="lazy"/>` : `<span class="product-emoji">${p.emoji || "🍽️"}</span>`}
        <span class="product-cat-badge">${p.category || "Food"}</span>
      </div>
      <div class="product-body">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.description}</p>
        <div class="product-footer">
          <span class="product-price">₹${p.price}</span>
          <button class="btn-order" onclick="window.addToCartById('${p.docId}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            Add to Cart
          </button>
        </div>
      </div>
    </div>`
    )
    .join("");
}

window.addToCartById = (id) => {
  const p = allProducts.find((x) => x.docId === id);
  if (p) addToCart(p);
};

if (searchInput) {
  searchInput.addEventListener("input", (e) => {
    searchTerm = e.target.value.toLowerCase().trim();
    renderProducts();
  });
}

categoryBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    categoryBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    activeCategory = btn.dataset.cat;
    renderProducts();
  });
});

// ──────────────────────────────────────────────
// Cart Modal / Checkout
// ──────────────────────────────────────────────
const cartModal = document.getElementById("cart-modal");
const cartItemsEl = document.getElementById("cart-items");
const cartTotalEl = document.getElementById("cart-total");
const checkoutForm = document.getElementById("checkout-form");

window.openCart = () => {
  renderCart();
  cartModal?.classList.add("open");
};
window.closeCart = () => cartModal?.classList.remove("open");

function renderCart() {
  const cart = getCart();
  if (!cart.length) {
    cartItemsEl.innerHTML = `<p class="cart-empty">Your cart is empty 🛒</p>`;
    if (cartTotalEl) cartTotalEl.textContent = "₹0";
    return;
  }
  cartItemsEl.innerHTML = cart
    .map(
      (i) => `
    <div class="cart-item">
      <span class="ci-emoji">${i.emoji || "🍽️"}</span>
      <div class="ci-info">
        <strong>${i.name}</strong>
        <span>₹${i.price} × ${i.qty}</span>
      </div>
      <div class="ci-controls">
        <button onclick="window.changeQty('${i.docId}',-1)">−</button>
        <span>${i.qty}</span>
        <button onclick="window.changeQty('${i.docId}',1)">+</button>
      </div>
      <span class="ci-sub">₹${i.price * i.qty}</span>
    </div>`
    )
    .join("");
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
  if (cartTotalEl) cartTotalEl.textContent = `₹${total}`;
}

window.changeQty = (id, delta) => {
  const cart = getCart();
  const idx = cart.findIndex((i) => i.docId === id);
  if (idx === -1) return;
  cart[idx].qty += delta;
  if (cart[idx].qty <= 0) cart.splice(idx, 1);
  saveCart(cart);
  renderCart();
};

if (checkoutForm) {
  checkoutForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const cart = getCart();
    if (!cart.length) return showToast("Add items to cart first!", "error");
    const name = document.getElementById("cust-name").value.trim();
    const phone = document.getElementById("cust-phone").value.trim();
    const address = document.getElementById("cust-address").value.trim();
    if (!name || !phone || !address) return showToast("Please fill all fields!", "error");

    const submitBtn = checkoutForm.querySelector("button[type=submit]");
    submitBtn.disabled = true;
    submitBtn.textContent = "Placing order…";

    try {
      const total = cart.reduce((s, i) => s + i.price * i.qty, 0);
      const { id: docId, orderId } = await placeOrder({ name, phone, address, items: cart, total });
      saveCart([]);
      closeCart();
      showOrderConfirmation(docId, orderId);
      showToast(`Order ${orderId} placed! 🎉`);
    } catch (err) {
      showToast("Failed to place order. Try again.", "error");
      console.error(err);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Place Order";
    }
  });
}

// ──────────────────────────────────────────────
// Order confirmation + real-time status
// ──────────────────────────────────────────────
const orderModal = document.getElementById("order-modal");
let unsubscribeOrder = null;

function showOrderConfirmation(docId, orderId) {
  if (!orderModal) return;
  document.getElementById("confirm-order-id").textContent = orderId;
  document.getElementById("order-status-text").textContent = "Pending";
  orderModal.classList.add("open");

  if (unsubscribeOrder) unsubscribeOrder();
  unsubscribeOrder = listenToOrder(docId, (data) => {
    const statusEl = document.getElementById("order-status-text");
    if (statusEl) statusEl.textContent = data.status;
    statusEl?.setAttribute("data-status", data.status.toLowerCase());

    if (data.status === "Ready") {
      document.getElementById("ready-notification")?.classList.remove("hidden");
      showToast("🎉 Your order is ready for pickup/delivery!", "success");
    }
  });
}

window.closeOrderModal = () => {
  orderModal?.classList.remove("open");
  if (unsubscribeOrder) {
    unsubscribeOrder();
    unsubscribeOrder = null;
  }
};

// ──────────────────────────────────────────────
// Contact Form
// ──────────────────────────────────────────────
const contactForm = document.getElementById("contact-form");
if (contactForm) {
  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("cf-name").value.trim();
    const email = document.getElementById("cf-email").value.trim();
    const message = document.getElementById("cf-message").value.trim();

    // Validation
    if (!name) return showFieldError("cf-name", "Name is required");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      return showFieldError("cf-email", "Valid email required");
    if (message.length < 10)
      return showFieldError("cf-message", "Message must be at least 10 characters");

    const btn = contactForm.querySelector("button[type=submit]");
    btn.disabled = true;
    btn.textContent = "Sending…";

    try {
      await submitContactMessage({ name, email, message });
      contactForm.reset();
      showToast("Message sent! We'll get back to you soon. 💚");
    } catch {
      showToast("Failed to send message. Try again.", "error");
    } finally {
      btn.disabled = false;
      btn.textContent = "Send Message";
    }
  });
}

function showFieldError(id, msg) {
  const el = document.getElementById(id);
  el?.classList.add("field-error");
  const errEl = document.getElementById(`${id}-err`);
  if (errEl) errEl.textContent = msg;
  el?.addEventListener("input", () => {
    el.classList.remove("field-error");
    if (errEl) errEl.textContent = "";
  }, { once: true });
}

// ──────────────────────────────────────────────
// Init
// ──────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  updateCartBadge();
  loadProducts();
  hideLoader();

  // Animate elements on scroll
  const observer = new IntersectionObserver(
    (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add("visible")),
    { threshold: 0.12 }
  );
  document.querySelectorAll(".animate-on-scroll").forEach((el) => observer.observe(el));
});
