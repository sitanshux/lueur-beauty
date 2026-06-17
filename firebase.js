// ============================================================
//  firebase.js — Lueur Beauty
//  Firebase v12 — CDN ES Module build
//  Initializes Firebase and exports auth, db, and
//  helper functions globally (modular SDK requires standalone
//  function calls rather than instance methods).
// ============================================================

import { initializeApp }                                        from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword,
         createUserWithEmailAndPassword,
         onAuthStateChanged, signOut }                         from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, getDoc,
         doc, setDoc, updateDoc, deleteDoc, serverTimestamp, onSnapshot }          from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// ---------------------------------------------------------------------------
// Firebase project configuration
// ---------------------------------------------------------------------------
const firebaseConfig = {
  apiKey:            "AIzaSyAqBHgGwXe-P5nZes2bqWG9eYoe6TT7oSA",
  authDomain:        "lueur-beauty.firebaseapp.com",
  projectId:         "lueur-beauty",
  storageBucket:     "lueur-beauty.firebasestorage.app",
  messagingSenderId: "969522564604",
  appId:             "1:969522564604:web:c6ad0d756e055ff75ef679"
};

// ---------------------------------------------------------------------------
// Initialize Firebase
// ---------------------------------------------------------------------------
const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// ---------------------------------------------------------------------------
// Global service instances
// ---------------------------------------------------------------------------
window.auth = auth;
window.db   = db;

// ---------------------------------------------------------------------------
// Standalone auth helpers (modular SDK — no instance methods)
// ---------------------------------------------------------------------------
window.firebaseSignIn              = (email, password) => signInWithEmailAndPassword(auth, email, password);
window.firebaseSignUp              = (email, password) => createUserWithEmailAndPassword(auth, email, password);
window.firebaseOnAuthStateChanged  = (cb)              => onAuthStateChanged(auth, cb);
window.firebaseSignOut             = ()                => signOut(auth);

// ---------------------------------------------------------------------------
// Firestore helpers
// ---------------------------------------------------------------------------
window.firestoreAddDoc        = (colName, data) => addDoc(collection(db, colName), { ...data, createdAt: serverTimestamp() });
window.firestoreGetDocs       = (colName)       => getDocs(collection(db, colName));
window.firestoreGetDoc        = (colName, id)   => getDoc(doc(db, colName, id));
window.firestoreSetDoc        = (colName, id, data) => setDoc(doc(db, colName, id), data, { merge: true });
window.firestoreUpdateDoc     = (colName, id, data) => updateDoc(doc(db, colName, id), data);
window.firestoreDeleteDoc     = (colName, id)       => deleteDoc(doc(db, colName, id));
window.firestoreOnSnapshot    = (colName, cb)       => onSnapshot(collection(db, colName), cb);

// ---------------------------------------------------------------------------
// Reviews collection helpers
// ---------------------------------------------------------------------------
window.firestoreCreateReview = (productId, orderId, rating, review, customerName) => {
  return addDoc(collection(db, "reviews"), {
    productId: String(productId),
    orderId: String(orderId),
    rating: Number(rating),
    review: String(review),
    customerName: String(customerName),
    createdAt: serverTimestamp()
  });
};
window.firestoreGetReviews = () => getDocs(collection(db, "reviews"));
