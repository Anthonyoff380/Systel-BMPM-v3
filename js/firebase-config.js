/* ============================================================
   SYSTEL POMPIERS - CONFIGURATION FIREBASE (EXEMPLE)
   ============================================================ 
   Pour activer Firebase sur Vercel :
   1. Créez un projet sur https://console.firebase.google.com/
   2. Activez "Authentication" et "Firestore Database"
   3. Copiez vos clés ici et décommentez le code ci-dessous
*/

/*
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyACbm5zQiH-JvvZtHLL4zKiKLHPuByNzvI",
  authDomain: "sitebmpm.firebaseapp.com",
  projectId: "sitebmpm",
  storageBucket: "sitebmpm.firebasestorage.app",
  messagingSenderId: "896341553765",
  appId: "1:896341553765:web:7b7bf7e7f65a3ccd8c0c8c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

export { db, auth };
*/

console.log("Firebase config ready. Décommentez le code dans js/firebase-config.js pour activer la synchro réelle.");
