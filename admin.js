// ============================================================
// admin.js — Admin login + dashboard logic
// ============================================================

import {
  getAllOrders,
  updateOrderStatus,
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getAllMessages,
  adminLogin,
  adminLogout,
  onAdminAuthChange,
  db,
} from "./firebase.js";

import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ──────────────────────────────────────────────
// Toast
// ──────────────────────────────────────────────
function showToast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add("show"), 10);
  setTimeout(() => { t.classList.remove("show"); setTimeout(() => t.remove(), 400); }, 3200);
}

// ──────────────────────────────────────────────
// Admin Login Page
// ──────────────────────────────────────────────
const loginForm = document.getElementById("admin-login-form");
if (loginForm) {
  // If already logged in, redirect
  onAdminAuthChange((user) => {
    if (user) window.location.href = "admin-dashboard.html";
  });

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("admin-email").value.trim();
    const password = document.getElementById("admin-password").value;
    const errEl = document.getElementById("login-error");
    const btn = loginForm.querySelector("button[type=submit]");

    btn.disabled = true;
    btn.textContent = "Logging in…";
    errEl.textContent = "";

    try {
      await adminLogin(email, password);
      window.location.href = "admin-dashboard.html";
    } catch (err) {
      errEl.textContent = "Invalid credentials. Please try again.";
      btn.disabled = false;
      btn.textContent = "Login";
    }
  });
}

// ──────────────────────────────────────────────
// Admin Dashboard Page
// ──────────────────────────────────────────────
if (document.getElementById("admin-dashboard")) {
  // Auth guard
  onAdminAuthChange((user) => {
    if (!user) window.location.href = "admin-login.html";
    else document.getElementById("admin-email-display").textContent = user.email;
  });

  // Logout
  document.getElementById("logout-btn")?.addEventListener("click", async () => {
    await adminLogout();
    window.location.href = "admin-login.html";
  });

  // Tabs
  const tabs = document.querySelectorAll(".admin-tab");
  const panels = document.querySelectorAll(".admin-panel");
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.panel)?.classList.add("active");
    });
  });

  // ── Orders ──
  const ordersTable = document.getElementById("orders-tbody");
  const ordersCount = document.getElementById("orders-count");

  const ordersQ = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  onSnapshot(ordersQ, (snap) => {
    const orders = snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
    if (ordersCount) ordersCount.textContent = orders.length;
    renderOrdersTable(orders);
  });

  function renderOrdersTable(orders) {
    if (!ordersTable) return;
    if (!orders.length) {
      ordersTable.innerHTML = `<tr><td colspan="7" class="empty-row">No orders yet</td></tr>`;
      return;
    }
    ordersTable.innerHTML = orders.map((o) => `
      <tr>
        <td><strong>${o.orderId}</strong></td>
        <td>${o.name}</td>
        <td>${o.phone || "—"}</td>
        <td class="items-cell">${(o.items || []).map((i) => `${i.name} ×${i.qty}`).join(", ")}</td>
        <td>₹${o.total}</td>
        <td><span class="status-badge status-${(o.status || "pending").toLowerCase()}">${o.status}</span></td>
        <td>
          <select class="status-select" data-docid="${o.docId}" onchange="window.changeStatus(this)">
            ${["Pending","Accepted","Preparing","Ready","Delivered"].map(
              s => `<option ${o.status === s ? "selected" : ""}>${s}</option>`
            ).join("")}
          </select>
        </td>
      </tr>`).join("");
  }

  window.changeStatus = async (sel) => {
    const docId = sel.dataset.docid;
    const status = sel.value;
    try {
      await updateOrderStatus(docId, status);
      showToast(`Order status updated to "${status}"`);
    } catch {
      showToast("Failed to update status", "error");
    }
  };

  // ── Products ──
  const productsAdminList = document.getElementById("products-admin-list");
  const productModal = document.getElementById("product-modal");
  const productForm = document.getElementById("product-form");
  let editingProductId = null;
  let adminProducts = [];

  async function loadAdminProducts() {
    try {
      adminProducts = await getAllProducts();
      renderAdminProducts(adminProducts);
      document.getElementById("products-count").textContent = adminProducts.length;
    } catch { showToast("Failed to load products", "error"); }
  }

  function renderAdminProducts(prods) {
    if (!productsAdminList) return;
    if (!prods.length) {
      productsAdminList.innerHTML = `<p class="empty-row">No products yet. Add your first product!</p>`;
      return;
    }
    productsAdminList.innerHTML = prods.map((p) => `
      <div class="admin-product-card">
        <div class="apc-emoji">${p.emoji || "🍽️"}</div>
        <div class="apc-info">
          <strong>${p.name}</strong>
          <span class="apc-cat">${p.category}</span>
          <span>₹${p.price}</span>
        </div>
        <div class="apc-actions">
          <button class="btn-edit" onclick="window.openEditProduct('${p.docId}')">✏️ Edit</button>
          <button class="btn-delete" onclick="window.deleteProductById('${p.docId}')">🗑️ Delete</button>
        </div>
      </div>`).join("");
  }

  window.openAddProduct = () => {
    editingProductId = null;
    productForm.reset();
    document.getElementById("pm-title").textContent = "Add Product";
    productModal?.classList.add("open");
  };

  window.openEditProduct = (id) => {
    const p = adminProducts.find((x) => x.docId === id);
    if (!p) return;
    editingProductId = id;
    document.getElementById("pm-title").textContent = "Edit Product";
    document.getElementById("pm-name").value = p.name;
    document.getElementById("pm-category").value = p.category;
    document.getElementById("pm-price").value = p.price;
    document.getElementById("pm-description").value = p.description;
    document.getElementById("pm-emoji").value = p.emoji || "";
    document.getElementById("pm-imageUrl").value = p.imageUrl || "";
    productModal?.classList.add("open");
  };

  window.closeProductModal = () => productModal?.classList.remove("open");

  window.deleteProductById = async (id) => {
    if (!confirm("Delete this product?")) return;
    try {
      await deleteProduct(id);
      showToast("Product deleted");
      loadAdminProducts();
    } catch { showToast("Delete failed", "error"); }
  };

  if (productForm) {
    productForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = {
        name: document.getElementById("pm-name").value.trim(),
        category: document.getElementById("pm-category").value.trim(),
        price: Number(document.getElementById("pm-price").value),
        description: document.getElementById("pm-description").value.trim(),
        emoji: document.getElementById("pm-emoji").value.trim(),
        imageUrl: document.getElementById("pm-imageUrl").value.trim(),
      };
      const btn = productForm.querySelector("button[type=submit]");
      btn.disabled = true;
      try {
        if (editingProductId) {
          await updateProduct(editingProductId, data);
          showToast("Product updated!");
        } else {
          await addProduct(data);
          showToast("Product added!");
        }
        productModal.classList.remove("open");
        loadAdminProducts();
      } catch { showToast("Save failed", "error"); }
      finally { btn.disabled = false; }
    });
  }

  // ── Messages ──
  const messagesList = document.getElementById("messages-list");
  const messagesCount = document.getElementById("messages-count");

  async function loadMessages() {
    try {
      const msgs = await getAllMessages();
      if (messagesCount) messagesCount.textContent = msgs.length;
      if (!messagesList) return;
      if (!msgs.length) {
        messagesList.innerHTML = `<p class="empty-row">No messages yet</p>`;
        return;
      }
      messagesList.innerHTML = msgs.map((m) => `
        <div class="msg-card ${m.read ? "" : "unread"}">
          <div class="msg-header">
            <strong>${m.name}</strong>
            <span>${m.email}</span>
            <small>${m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString() : ""}</small>
          </div>
          <p>${m.message}</p>
        </div>`).join("");
    } catch { showToast("Failed to load messages", "error"); }
  }

  // Init dashboard
  loadAdminProducts();
  loadMessages();
}
