// ============================================================
// firebase.js — Firebase initialization & shared helpers
// Replace the firebaseConfig values with your own project's
// settings from the Firebase Console.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
  where,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// ──────────────────────────────────────────────
// 🔧 YOUR FIREBASE CONFIG  (replace these values)
// ──────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ──────────────────────────────────────────────
// Utility: generate a short readable order ID
// ──────────────────────────────────────────────
function generateOrderId() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let id = "ORD-";
  for (let i = 0; i < 8; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

// ──────────────────────────────────────────────
// Orders
// ──────────────────────────────────────────────
async function placeOrder(orderData) {
  const orderId = generateOrderId();
  const ref = await addDoc(collection(db, "orders"), {
    ...orderData,
    orderId,
    status: "Pending",
    createdAt: serverTimestamp(),
  });
  return { id: ref.id, orderId };
}

async function getAllOrders() {
  const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
}

async function updateOrderStatus(docId, status) {
  await updateDoc(doc(db, "orders", docId), { status, updatedAt: serverTimestamp() });
}

// Real-time listener for a single order (customer notification)
function listenToOrder(docId, callback) {
  return onSnapshot(doc(db, "orders", docId), (snap) => {
    if (snap.exists()) callback({ docId: snap.id, ...snap.data() });
  });
}

// ──────────────────────────────────────────────
// Products
// ──────────────────────────────────────────────
async function getAllProducts() {
  const snap = await getDocs(collection(db, "products"));
  return snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
}

async function addProduct(data) {
  return await addDoc(collection(db, "products"), { ...data, createdAt: serverTimestamp() });
}

async function updateProduct(docId, data) {
  await updateDoc(doc(db, "products", docId), data);
}

async function deleteProduct(docId) {
  await deleteDoc(doc(db, "products", docId));
}

// ──────────────────────────────────────────────
// Contact messages
// ──────────────────────────────────────────────
async function submitContactMessage(data) {
  return await addDoc(collection(db, "messages"), {
    ...data,
    createdAt: serverTimestamp(),
    read: false,
  });
}

async function getAllMessages() {
  const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
}

// ──────────────────────────────────────────────
// Auth helpers
// ──────────────────────────────────────────────
async function adminLogin(email, password) {
  return await signInWithEmailAndPassword(auth, email, password);
}

async function adminLogout() {
  return await signOut(auth);
}

function onAdminAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

export {
  db,
  auth,
  generateOrderId,
  placeOrder,
  getAllOrders,
  updateOrderStatus,
  listenToOrder,
  getAllProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  submitContactMessage,
  getAllMessages,
  adminLogin,
  adminLogout,
  onAdminAuthChange,
};
