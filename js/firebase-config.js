/*============================================================
   SYSTEL POMPIERS — FIREBASE CONFIG PROPRE
=============================================================*/

// CONFIG FIREBASE
const firebaseConfig = {
  apiKey: "AIzaSyCXznL5S4qJ9yNUZk-XV0ntI2GOFrX_seM",
  authDomain: "systelbmpm.firebaseapp.com",
  projectId: "systelbmpm",
  storageBucket: "systelbmpm.firebasestorage.app",
  messagingSenderId: "1044534675484",
  appId: "1:1044534675484:web:067e9b4d0b72aaf1ef37d9",
  measurementId: "G-KSNZWKSDLV"
};

// INITIALISATION FIREBASE
firebase.initializeApp(firebaseConfig);

const db = firebase.firestore();

console.log("✅ Firebase connecté");

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

// ============================================================
// USERS
// ============================================================

function fbListenUsers(callback) {
  db.collection(COL.USERS).onSnapshot((snapshot) => {
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

  await db.collection(COL.USERS).doc(id).set({
    ...user,
    id
  }, { merge: true });
}

// ============================================================
// ENGINS
// ============================================================

function fbListenEngins(callback) {
  db.collection(COL.ENGINS).onSnapshot((snapshot) => {
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
  const id = engin.id || engin.code;

  await db.collection(COL.ENGINS).doc(id).set({
    ...engin,
    id
  }, { merge: true });
}

// ============================================================
// INTERVENTIONS
// ============================================================

function fbListenInterventions(callback) {
  db.collection(COL.INTERVENTIONS).onSnapshot((snapshot) => {
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

  await db.collection(COL.INTERVENTIONS).doc(id).set({
    ...intervention,
    id
  }, { merge: true });
}

// ============================================================
// FEUILLES DE GARDE
// ============================================================

function fbListenFeuilles(callback) {
  db.collection(COL.FEUILLES).onSnapshot((snapshot) => {
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

  await db.collection(COL.FEUILLES).doc(id).set({
    ...feuille,
    id
  }, { merge: true });
}

// ============================================================
// BIPS
// ============================================================

function fbListenBips(userId, callback) {
  db.collection(COL.BIPS)
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

  await db.collection(COL.BIPS).add({
    targetUserId: userId,
    timestamp: new Date().toISOString(),
    read: false,
    ...data
  });

}

// ============================================================
// PRESENCE / DISPO
// ============================================================

async function fbUpdatePresence(userId, status) {

  await db.collection(COL.USERS).doc(userId).set({
    presence: status,
    lastUpdate: new Date().toISOString()
  }, { merge: true });

}

// ============================================================
// HEARTBEAT
// ============================================================

let heartbeatInterval = null;

function startHeartbeat(userId) {

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

  heartbeatInterval = setInterval(async () => {

    await db.collection(COL.USERS).doc(userId).set({
      online: true,
      heartbeat: new Date().toISOString()
    }, { merge: true });

  }, 30000);

}

// ============================================================
// STOP LISTENERS
// ============================================================

window.addEventListener("beforeunload", () => {

  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }

});