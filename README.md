# 🌶️ SpiceFusion — Food Ordering Website

A complete, production-ready food ordering website with Firebase backend, admin dashboard, and real-time order tracking.

---

## 📁 Project Structure

```
spicefusion/
├── index.html              ← Home page
├── about.html              ← About page
├── products.html           ← Menu / Products page
├── contact.html            ← Contact page
├── admin-login.html        ← Hidden admin login (not in navbar)
├── admin-dashboard.html    ← Admin dashboard
├── firebase.json           ← Firebase Hosting config
├── css/
│   └── style.css           ← All styles (responsive)
└── js/
    ├── firebase.js         ← Firebase init + all DB helpers
    ├── app.js              ← Customer-facing logic
    └── admin.js            ← Admin login + dashboard logic
```

---

## 🔧 Firebase Setup (Required)

### Step 1 — Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **Add project** → name it `spicefusion` → Continue
3. Disable Google Analytics (optional) → Create project

### Step 2 — Enable Firestore
1. In your project, go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** (for development)
3. Select a region close to you (e.g. `asia-south1` for India)

### Step 3 — Enable Authentication
1. Go to **Authentication** → **Get started**
2. Enable **Email/Password** sign-in
3. Go to **Users** tab → **Add user**
4. Enter your admin email and a strong password
   - e.g. `admin@spicefusion.in` / `YourSecurePassword123!`

### Step 4 — Add Your Config to firebase.js
1. Go to **Project Settings** (gear icon) → **General** → scroll to **Your apps**
2. Click **</>** (Web app) → Register app → Copy the config
3. Open `js/firebase.js` and replace the `firebaseConfig` object:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456:web:abcdef"
};
```

### Step 5 — Firestore Security Rules (Production)
Replace test-mode rules with these in **Firestore → Rules**:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Orders: anyone can create, only admin can read/update
    match /orders/{orderId} {
      allow create: if true;
      allow read, update: if request.auth != null;
    }

    // Products: anyone can read, only admin can write
    match /products/{productId} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Messages: anyone can create, only admin can read
    match /messages/{messageId} {
      allow create: if true;
      allow read: if request.auth != null;
    }
  }
}
```

---

## 🚀 Firebase Hosting Deployment

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# In your project folder
firebase init hosting
# → Use existing project → select your project
# → Public directory: . (just a dot)
# → Single page app: No

# Deploy
firebase deploy --only hosting
```

Your site will be live at `https://your-project.web.app`

---

## 🔑 Admin Access

Navigate to `/admin-login.html` — this page is:
- Not linked anywhere in the public navbar
- Marked `noindex, nofollow` (won't appear in Google)
- Protected by Firebase Authentication

Login with the admin credentials you created in Step 3.

---

## ✨ Features Summary

| Feature | Status |
|---|---|
| Home, About, Menu, Contact pages | ✅ |
| Mobile responsive (hamburger menu) | ✅ |
| 10 demo products (+ Firebase products) | ✅ |
| Search + category filter | ✅ |
| Add to cart (session storage) | ✅ |
| Checkout form + order placement | ✅ |
| Unique order ID generation | ✅ |
| Real-time order status tracking | ✅ |
| "Order Ready" customer notification | ✅ |
| Contact form → Firestore | ✅ |
| Admin login (Firebase Auth) | ✅ |
| Admin: view all orders | ✅ |
| Admin: change order status | ✅ |
| Admin: add / edit / delete products | ✅ |
| Admin: view contact messages | ✅ |
| Loading animations | ✅ |
| Scroll-triggered animations | ✅ |
| SEO-friendly HTML structure | ✅ |

---

## 🎨 Design

- **Brand**: SpiceFusion — Indian & fusion food delivery
- **Palette**: Saffron `#F59E0B` · Charcoal `#1C1917` · Cream `#FEF9EE` · Green `#16A34A`
- **Fonts**: Playfair Display (headings) + Inter (body)
- **Signature**: Animated food emoji hero with floating bowl

---

Made with ❤️ in Tamil Nadu. Powered by Firebase.
