/* ============================================================
   SYSTEL POMPIERS - CONFIGURATION FIREBASE OFFICIELLE
   ============================================================ */

const firebaseConfig = {
  apiKey: "AIzaSyACbm5zQiH-JvvZtHLL4zKiKLHPuByNzvI",
  authDomain: "sitebmpm.firebaseapp.com",
  projectId: "sitebmpm",
  storageBucket: "sitebmpm.firebasestorage.app",
  messagingSenderId: "896341553765",
  appId: "1:896341553765:web:7b7bf7e7f65a3ccd8c0c8c"
};

// Note: Pour activer Firebase réellement sur Vercel, vous devrez importer
// les modules Firebase dans vos scripts JS. Pour l'instant, le système
// utilise LocalStorage pour garantir un fonctionnement immédiat.

console.log("Firebase Config intégrée pour le projet : sitebmpm");
export default firebaseConfig;
