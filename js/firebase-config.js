/*============================================================
   SYSTEL POMPIERS — FIREBASE CONFIG COMPATIBLE
=============================================================*/

// ============================================================
// CONFIG FIREBASE
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCXznL5S4qJ9yNUZk-XV0ntI2GOFrX_seM",
  authDomain: "systelbmpm.firebaseapp.com",
  projectId: "systelbmpm",
  storageBucket: "systelbmpm.firebasestorage.app",
  messagingSenderId: "1044534675484",
  appId: "1:1044534675484:web:067e9b4d0b72aaf1ef37d9",
  measurementId: "G-KSNZWKSDLV"
};

// ============================================================
// INITIALISATION
// ============================================================

firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

console.log("✅ Firebase connecté");

// ============================================================
// VARIABLES GLOBALES COMPATIBILITÉ
// ============================================================

let _fbReady = true;

window._fbReady = true;
window.db = db;

// ============================================================
// CALLBACK READY
// ============================================================

function initFirebase() {
  console.log("✅ Firebase initialisé");
  return true;
}

function onFirebaseReady(callback) {
  console.log("✅ Firebase ready callback");

  if (typeof callback === "function") {
    callback();
  }
}

window.initFirebase = initFirebase;
window.onFirebaseReady = onFirebaseReady;

// ============================================================
// COLLECTIONS
// ============================================================

const COL = {
  USERS: "systel_users",
  ENGINS: "systel_engins",
  INTERVENTIONS: "systel_interventions",
  FEUILLES: "systel_feuilles_garde",
  BIPS: "systel_bip_alertes",
  PLANNING: "systel_planning"
};

window.COL = COL;

// ============================================================
// USERS
// ============================================================

function fbListenUsers(callback) {

  return db.collection(COL.USERS)
    .onSnapshot((snapshot) => {

      const users = [];

      snapshot.forEach((doc) => {

        users.push({
          id: doc.id,
          ...doc.data()
        });

      });

      callback(users);

    });

}

async function fbSaveUser(user) {

  const id = user.id || Date.now().toString();

  await db.collection(COL.USERS)
    .doc(id)
    .set({
      ...user,
      id
    }, { merge: true });

}

window.fbListenUsers = fbListenUsers;
window.fbSaveUser = fbSaveUser;

// ============================================================
// ENGINS
// ============================================================

function fbListenEngins(callback) {

  return db.collection(COL.ENGINS)
    .onSnapshot((snapshot) => {

      const engins = [];

      snapshot.forEach((doc) => {

        engins.push({
          id: doc.id,
          ...doc.data()
        });

      });

      callback(engins);

    });

}

async function fbSaveEngin(engin) {

  const id = engin.id || engin.code || Date.now().toString();

  await db.collection(COL.ENGINS)
    .doc(id)
    .set({
      ...engin,
      id
    }, { merge: true });

}

window.fbListenEngins = fbListenEngins;
window.fbSaveEngin = fbSaveEngin;

// ============================================================
// ENGINS (fonctions batch manquantes)
// ============================================================

window.fbLoadEngins = async function () {
  try {
    const snapshot = await db.collection(COL.ENGINS || 'engins').get();
    const engins = [];
    snapshot.forEach((doc) => {
      engins.push({ id: doc.id, ...doc.data() });
    });
    return engins;
  } catch (e) {
    console.error('fbLoadEngins error:', e);
    return [];
  }
};

window.fbSaveEngins = async function (engins) {
  try {
    const batch = db.batch();
    engins.forEach((engin) => {
      const id = engin.id || Date.now().toString();
      const ref = db.collection(COL.ENGINS || 'engins').doc(id);
      batch.set(ref, { ...engin, id }, { merge: true });
    });
    await batch.commit();
  } catch (e) {
    console.error('fbSaveEngins error:', e);
  }
};

// ============================================================
// INTERVENTIONS
// ============================================================

function fbListenInterventions(callback) {

  return db.collection(COL.INTERVENTIONS)
    .onSnapshot((snapshot) => {

      const interventions = [];

      snapshot.forEach((doc) => {

        interventions.push({
          id: doc.id,
          ...doc.data()
        });

      });

      callback(interventions);

    });

}

async function fbSaveIntervention(intervention) {

  const id = intervention.id || Date.now().toString();

  await db.collection(COL.INTERVENTIONS)
    .doc(id)
    .set({
      ...intervention,
      id
    }, { merge: true });

}

window.fbListenInterventions = fbListenInterventions;
window.fbSaveIntervention = fbSaveIntervention;

// ============================================================
// FEUILLES DE GARDE
// ============================================================

function fbListenFeuilles(callback) {

  return db.collection(COL.FEUILLES)
    .onSnapshot((snapshot) => {

      const feuilles = [];

      snapshot.forEach((doc) => {

        feuilles.push({
          id: doc.id,
          ...doc.data()
        });

      });

      callback(feuilles);

    });

}

async function fbSaveFeuille(feuille) {

  const id = feuille.id || Date.now().toString();

  await db.collection(COL.FEUILLES)
    .doc(id)
    .set({
      ...feuille,
      id
    }, { merge: true });

}

window.fbListenFeuilles = fbListenFeuilles;
window.fbSaveFeuille = fbSaveFeuille;

// ============================================================
// BIPS
// ============================================================

function fbListenBips(userId, callback) {

  return db.collection(COL.BIPS)
    .where("targetUserId", "==", userId)
    .onSnapshot((snapshot) => {

      snapshot.docChanges().forEach((change) => {

        if (change.type === "added") {

          callback(change.doc.data());

        }

      });

    });

}

async function fbSendBip(userId, data = {}) {

  await db.collection(COL.BIPS)
    .add({
      targetUserId: userId,
      timestamp: new Date().toISOString(),
      read: false,
      ...data
    });

}

window.fbListenBips = fbListenBips;
window.fbSendBip = fbSendBip;

// ============================================================
// PRESENCE
// ============================================================

async function fbUpdatePresence(userId, status) {

  await db.collection(COL.USERS)
    .doc(userId)
    .set({
      presence: status,
      lastUpdate: new Date().toISOString()
    }, { merge: true });

}

window.fbUpdatePresence = fbUpdatePresence;

// ============================================================
// HEARTBEAT
// ============================================================

let heartbeatInterval = null;

async function startHeartbeat(userId) {

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  // Écriture immédiate dès la connexion
  await db.collection(COL.USERS)
    .doc(userId)
    .set({
      online: true,
      heartbeat: new Date().toISOString()
    }, { merge: true });

  // Puis toutes les 30 secondes
  heartbeatInterval = setInterval(async () => {

    await db.collection(COL.USERS)
      .doc(userId)
      .set({
        online: true,
        heartbeat: new Date().toISOString()
      }, { merge: true });

  }, 30000);

}

window.startHeartbeat = startHeartbeat;

// ============================================================
// CLEANUP
// ============================================================

window.addEventListener("beforeunload", () => {

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  // Marquer offline à la déconnexion
  const userId = localStorage.getItem('systel_current_user_id');
  if (userId) {
    db.collection(COL.USERS).doc(userId).set(
      { online: false, presence: "INDISPO", heartbeat: new Date().toISOString() },
      { merge: true }
    );
  }

});

// ============================================================
// ANCIENNES FONCTIONS COMPATIBILITÉ
// ============================================================

window.fbLoadUsers = async function () {

  try {

    const snapshot = await db.collection(COL.USERS).get();

    const users = [];

    snapshot.forEach((doc) => {

      users.push({
        id: doc.id,
        ...doc.data()
      });

    });

    return users;

  } catch (e) {

    console.error(e);
    return [];

  }

};

window.migrateFromLocalStorage = function () {

  console.log("⚠️ Migration ignorée");

  return true;

};

// ============================================================
// 🔧 COMPATIBILITÉ FONCTIONS MANQUANTES (FIX FINAL)
// ============================================================

// INTERVENTIONS
window.fbLoadInterventions = async function () {
  const snapshot = await db.collection(COL.INTERVENTIONS).get();

  const data = [];
  snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));

  return data;
};

// PLANNING
window.fbSavePlanning = async function (planning) {
  const id = planning.id || "default";

  await db.collection(COL.PLANNING)
    .doc(id)
    .set({ ...planning, id }, { merge: true });
};

window.fbLoadPlanning = async function () {
  const snapshot = await db.collection(COL.PLANNING).get();

  const data = [];
  snapshot.forEach(doc => data.push({ id: doc.id, ...doc.data() }));

  return data;
};
// ============================================================
// FIX 1 — fbTriggerBip (alias de fbSendBip)
// ============================================================

window.fbTriggerBip = async function (userId, motif = 'INTERVENTION', data = {}) {
  await db.collection(COL.BIPS).add({
    targetUserId: userId,
    motif: motif,
    timestamp: new Date().toISOString(),
    read: false,
    ...data
  });
};

// ============================================================
// FIX 2 — fbListenPresence (écoute online/presence sur USERS)
// ============================================================

window.fbListenPresence = function (callback) {
  return db.collection(COL.USERS)
    .onSnapshot((snapshot) => {
      const users = [];
      snapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });
      callback(users);
    });
};

// ============================================================
// FIX 3 — fbListenPlanning (écoute en temps réel)
// ============================================================

window.fbListenPlanning = function (callback) {
  return db.collection(COL.PLANNING)
    .onSnapshot((snapshot) => {
      const data = [];
      snapshot.forEach((doc) => data.push({ id: doc.id, ...doc.data() }));
      callback(data);
    });
};

// ============================================================
// FIX 4 — fbListenFeuilles retourne un OBJET {date: garde}
//          au lieu d'un tableau pour compatibilité feuille_garde.js
// ============================================================

// On remplace le listener feuilles pour retourner le bon format
window.fbListenFeuilles = function (callback) {
  return db.collection(COL.FEUILLES)
    .onSnapshot((snapshot) => {
      const feuillesObj = {};
      snapshot.forEach((doc) => {
        const data = doc.data();
        // La clé doc = la date (ex: "2025-06-01")
        feuillesObj[doc.id] = { ...data, id: doc.id };
      });
      callback(feuillesObj);
    });
};

// fbSaveFeuille : utilise la date comme ID du document
window.fbSaveFeuille = async function (date, feuille) {
  // Accepte fbSaveFeuille(obj) ou fbSaveFeuille(date, obj)
  if (typeof date === 'object' && date !== null) {
    feuille = date;
    date = feuille.date || feuille.id || Date.now().toString();
  }
  await db.collection(COL.FEUILLES)
    .doc(String(date))
    .set({ ...feuille, id: String(date) }, { merge: true });
};

// fbDeleteFeuille : supprime une feuille par date
window.fbDeleteFeuille = async function (date) {
  await db.collection(COL.FEUILLES).doc(String(date)).delete();
};

// ============================================================
// FIX 5 — fbDeleteUser (suppression réelle dans Firestore)
// ============================================================

window.fbDeleteUser = async function (userId) {
  try {
    await db.collection(COL.USERS).doc(userId).delete();
    console.log("🗑️ Utilisateur supprimé de Firestore:", userId);
  } catch (e) {
    console.error('fbDeleteUser error:', e);
  }
};
