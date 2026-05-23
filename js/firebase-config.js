/*============================================================
   SYSTEL POMPIERS — FIREBASE CONFIG v2 (CLOUD ONLY)
   Toutes les données passent par Firestore.
   Plus de localStorage pour les données critiques.
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

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
console.log("✅ Firebase connecté");

window._fbReady = true;
let _fbReady = true;
window.db = db;

// ============================================================
// COLLECTIONS
// ============================================================
const COL = {
  USERS:         "systel_users",
  ENGINS:        "systel_engins",
  INTERVENTIONS: "systel_interventions",
  FEUILLES:      "systel_feuilles_garde",
  BIPS:          "systel_bip_alertes",
  PLANNING:      "systel_planning",
  BLIPS:         "systel_carte_blips"
};
window.COL = COL;

// ============================================================
// CALLBACKS READY (compatibilité)
// ============================================================
function initFirebase() { return true; }
function onFirebaseReady(cb) { if (typeof cb === 'function') cb(); }
window.initFirebase  = initFirebase;
window.onFirebaseReady = onFirebaseReady;

// ============================================================
// USERS
// ============================================================
window.fbListenUsers = function(callback) {
  return db.collection(COL.USERS).onSnapshot(snap => {
    const users = [];
    snap.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
    callback(users);
  });
};

window.fbSaveUser = async function(user) {
  const id = user.id || Date.now().toString();
  await db.collection(COL.USERS).doc(id).set({ ...user, id }, { merge: true });
};

window.fbDeleteUser = async function(userId) {
  await db.collection(COL.USERS).doc(String(userId)).delete();
};

window.fbLoadUsers = async function() {
  const snap = await db.collection(COL.USERS).get();
  const users = [];
  snap.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
  return users;
};

// ============================================================
// ENGINS
// ============================================================
window.fbListenEngins = function(callback) {
  return db.collection(COL.ENGINS).onSnapshot(snap => {
    const engins = [];
    snap.forEach(doc => engins.push({ id: doc.id, ...doc.data() }));
    callback(engins);
  });
};

window.fbSaveEngin = async function(engin) {
  const id = engin.id || engin.code || Date.now().toString();
  await db.collection(COL.ENGINS).doc(String(id)).set({ ...engin, id: String(id) }, { merge: true });
};

window.fbSaveEngins = async function(engins) {
  if (!engins || !engins.length) return;
  const batch = db.batch();
  engins.forEach(engin => {
    const id = String(engin.id || engin.code || Date.now());
    batch.set(db.collection(COL.ENGINS).doc(id), { ...engin, id }, { merge: true });
  });
  await batch.commit();
};

window.fbDeleteEngin = async function(enginId) {
  await db.collection(COL.ENGINS).doc(String(enginId)).delete();
};

window.fbLoadEngins = async function() {
  const snap = await db.collection(COL.ENGINS).get();
  const engins = [];
  snap.forEach(doc => engins.push({ id: doc.id, ...doc.data() }));
  return engins;
};

// ============================================================
// INTERVENTIONS
// ============================================================
window.fbListenInterventions = function(callback) {
  return db.collection(COL.INTERVENTIONS).onSnapshot(snap => {
    const list = [];
    snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
    callback(list);
  });
};

window.fbSaveIntervention = async function(intervention) {
  const id = String(intervention.id || Date.now());
  await db.collection(COL.INTERVENTIONS).doc(id).set({ ...intervention, id }, { merge: true });
};

window.fbDeleteIntervention = async function(interId) {
  await db.collection(COL.INTERVENTIONS).doc(String(interId)).delete();
};

window.fbLoadInterventions = async function() {
  const snap = await db.collection(COL.INTERVENTIONS).get();
  const list = [];
  snap.forEach(doc => list.push({ id: doc.id, ...doc.data() }));
  return list;
};

// ============================================================
// FEUILLES DE GARDE  (clé = date "YYYY-MM-DD")
// ============================================================
window.fbListenFeuilles = function(callback) {
  return db.collection(COL.FEUILLES).onSnapshot(snap => {
    const obj = {};
    snap.forEach(doc => { obj[doc.id] = { ...doc.data(), id: doc.id }; });
    callback(obj); // retourne {date: garde, ...}
  });
};

window.fbSaveFeuille = async function(dateOrObj, feuilleArg) {
  let date, feuille;
  if (typeof dateOrObj === 'object' && dateOrObj !== null) {
    feuille = dateOrObj;
    date = feuille.date || feuille.id || Date.now().toString();
  } else {
    date = dateOrObj;
    feuille = feuilleArg;
  }
  await db.collection(COL.FEUILLES).doc(String(date)).set({ ...feuille, id: String(date) }, { merge: true });
};

window.fbDeleteFeuille = async function(date) {
  await db.collection(COL.FEUILLES).doc(String(date)).delete();
};

// ============================================================
// BIPS  (un document par bip, targetUserId + read)
// ============================================================
window.fbListenBips = function(userId, callback) {
  return db.collection(COL.BIPS)
    .where('targetUserId', '==', userId)
    .where('read', '==', false)
    .onSnapshot(snap => {
      snap.docChanges().forEach(change => {
        if (change.type === 'added') callback({ _docId: change.doc.id, ...change.doc.data() });
      });
    });
};

window.fbSendBip = async function(userId, data = {}) {
  await db.collection(COL.BIPS).add({
    targetUserId: userId,
    timestamp: new Date().toISOString(),
    read: false,
    ...data
  });
};

window.fbTriggerBip = window.fbSendBip; // alias

window.fbMarkBipRead = async function(docId) {
  if (!docId) return;
  await db.collection(COL.BIPS).doc(docId).update({ read: true });
};

// ============================================================
// PRÉSENCE  (heartbeat + online)
// ============================================================
window.fbListenPresence = function(callback) {
  return db.collection(COL.USERS).onSnapshot(snap => {
    const users = [];
    snap.forEach(doc => users.push({ id: doc.id, ...doc.data() }));
    callback(users);
  });
};

window.fbUpdatePresence = async function(userId, status) {
  await db.collection(COL.USERS).doc(userId).set(
    { presence: status, lastUpdate: new Date().toISOString() },
    { merge: true }
  );
};

// ============================================================
// HEARTBEAT
// ============================================================
let heartbeatInterval = null;

window.startHeartbeat = async function(userId) {
  if (heartbeatInterval) clearInterval(heartbeatInterval);

  const beat = async () => {
    await db.collection(COL.USERS).doc(userId).set(
      { online: true, heartbeat: new Date().toISOString() },
      { merge: true }
    );
  };

  await beat(); // immédiat au login
  heartbeatInterval = setInterval(beat, 30000);
};

// ============================================================
// PLANNING
// ============================================================
window.fbListenPlanning = function(callback) {
  return db.collection(COL.PLANNING).onSnapshot(snap => {
    const data = [];
    snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
    callback(data);
  });
};

window.fbSavePlanning = async function(id, planning) {
  // Accepte fbSavePlanning(planning) ou fbSavePlanning(id, planning)
  if (typeof id === 'object') { planning = id; id = 'default'; }
  await db.collection(COL.PLANNING).doc(String(id)).set({ ...planning, id: String(id) }, { merge: true });
};

window.fbLoadPlanning = async function() {
  const snap = await db.collection(COL.PLANNING).get();
  const data = [];
  snap.forEach(doc => data.push({ id: doc.id, ...doc.data() }));
  return data;
};

// ============================================================
// CARTE BLIPS — synchronisation temps réel multi-utilisateurs
// ============================================================
window.fbListenBlips = function(callback) {
  return db.collection(COL.BLIPS).onSnapshot(snap => {
    const blips = [];
    snap.forEach(doc => blips.push({ id: doc.id, ...doc.data() }));
    callback(blips);
  });
};

window.fbSaveBlip = async function(blip) {
  await db.collection(COL.BLIPS).doc(String(blip.id)).set({ ...blip, id: String(blip.id) }, { merge: true });
};

window.fbDeleteBlip = async function(blipId) {
  await db.collection(COL.BLIPS).doc(String(blipId)).delete();
};

// ============================================================
// CLEANUP — marquer offline à la fermeture
// ============================================================
window.addEventListener('beforeunload', () => {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  const userId = localStorage.getItem('systel_current_user_id');
  if (userId) {
    db.collection(COL.USERS).doc(userId).set(
      { online: false, presence: 'INDISPO', heartbeat: new Date().toISOString() },
      { merge: true }
    );
  }
});

// ============================================================
// COMPAT
// ============================================================
window.migrateFromLocalStorage = () => true;

async function fbTestPermissions() {
  try {
    await db.collection(COL.USERS).limit(1).get();
    return { error: null };
  } catch(e) {
    return { error: e.message };
  }
}
window.fbTestPermissions = fbTestPermissions;
