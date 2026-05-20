/*============================================================
   SYSTEL POMPIERS — FIREBASE FIRESTORE DATABASE LAYER
   Remplace localStorage par Firestore pour partage en temps réel
   ============================================================ */

// Import Firebase via CDN (chargé dans index.html)
let _db = null;
let _fbReady = false;
let _fbCallbacks = [];
let _listeners = {}; // Listeners temps réel actifs

// Initialiser Firebase
function initFirebase() {
  try {
    if (!window.firebase) { console.warn("Firebase SDK pas encore chargé"); return false; }
    
    // Charger la config depuis localStorage si elle existe (config dynamique)
    let config = null;
    const savedConfig = localStorage.getItem('systel_firebase_config');
    if (savedConfig) {
      try { config = JSON.parse(savedConfig); } catch(e) {}
    }
    
    // Sinon utiliser la config statique si elle existe
    if (!config && typeof FIREBASE_CONFIG !== 'undefined') {
      config = FIREBASE_CONFIG;
    }

    if (!config) {
      console.warn("Aucune configuration Firebase trouvée");
      return false;
    }

    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(config);
    }
    _db = firebase.firestore();
    _fbReady = true;
    console.log("✅ Firebase Firestore connecté");
    _fbCallbacks.forEach(fn => fn());
    _fbCallbacks = [];
    return true;
  } catch(e) {
    console.error("❌ Firebase init error:", e);
    return false;
  }
}

function onFirebaseReady(fn) {
  if (_fbReady) fn();
  else _fbCallbacks.push(fn);
}

// ============================================================
// COLLECTIONS FIRESTORE
// ============================================================
const COL = {
  CONFIG:        'systel_config',
  USERS:         'systel_users',
  CASERNES:      'systel_casernes',
  ENGINS:        'systel_engins',
  INTERVENTIONS: 'systel_interventions',
  COSSIM_CONFIG: 'systel_cossim_config',
  FEUILLES:      'systel_feuilles_garde',
  PLANNING:      'systel_planning',
  BLIPS:         'systel_blips',
  INTRANET:      'systel_intranet',
  BIP_ALERTES:   'systel_bip_alertes',
};

// ============================================================
// LECTURE / ÉCRITURE GÉNÉRIQUES
// ============================================================

// Lire un document par ID
async function fbGet(collection, docId) {
  if (!_db) return null;
  try {
    const snap = await _db.collection(collection).doc(docId).get();
    return snap.exists ? snap.data() : null;
  } catch(e) { console.warn('fbGet error:', e); return null; }
}

// Lire tous les documents d'une collection
async function fbGetAll(collection) {
  if (!_db) return [];
  try {
    const snap = await _db.collection(collection).get();
    return snap.docs.map(d => ({ _id: d.id, ...d.data() }));
  } catch(e) { console.warn('fbGetAll error:', e); return []; }
}

// Écrire / mettre à jour un document
async function fbSet(collection, docId, data) {
  if (!_db) return false;
  try {
    await _db.collection(collection).doc(docId).set(data, { merge: true });
    return true;
  } catch(e) { console.warn('fbSet error:', e); return false; }
}

// Supprimer un document
async function fbDelete(collection, docId) {
  if (!_db) return false;
  try {
    await _db.collection(collection).doc(docId).delete();
    return true;
  } catch(e) { console.warn('fbDelete error:', e); return false; }
}

// Écoute en temps réel d'une collection
function fbListen(collection, callback) {
  if (!_db) return;
  if (_listeners[collection]) _listeners[collection](); // Détacher l'ancien
  _listeners[collection] = _db.collection(collection).onSnapshot(snap => {
    const docs = snap.docs.map(d => ({ _id: d.id, ...d.data() }));
    callback(docs);
  });
}

// ============================================================
// API SYSTEL — COUCHE HAUTE
// ============================================================

// --- CONFIG ---
async function fbSaveConfig(config) {
  return fbSet(COL.CONFIG, 'main', config);
}
async function fbLoadConfig() {
  return await fbGet(COL.CONFIG, 'main');
}

// --- USERS ---
async function fbSaveUser(user) {
  const id = user.id || 'u_' + Date.now();
  return fbSet(COL.USERS, id, { ...user, id });
}
async function fbDeleteUser(userId) {
  return fbDelete(COL.USERS, userId);
}
async function fbLoadUsers() {
  return await fbGetAll(COL.USERS);
}
function fbListenUsers(callback) {
  fbListen(COL.USERS, callback);
}

// --- CASERNES ---
async function fbSaveCasernes(casernes) {
  return fbSet(COL.CASERNES, 'main', { data: casernes });
}
async function fbLoadCasernes() {
  const doc = await fbGet(COL.CASERNES, 'main');
  return doc?.data || [];
}

// --- ENGINS ---
async function fbSaveEngins(engins) {
  return fbSet(COL.ENGINS, 'main', { data: engins });
}
async function fbLoadEngins() {
  const doc = await fbGet(COL.ENGINS, 'main');
  return doc?.data || [];
}
function fbListenEngins(callback) {
  if (!_db) return;
  if (_listeners['engins']) _listeners['engins']();
  _listeners['engins'] = _db.collection(COL.ENGINS).doc('main').onSnapshot(snap => {
    callback(snap.exists ? (snap.data().data || []) : []);
  });
}

// --- INTERVENTIONS ---
async function fbSaveIntervention(inter) {
  const id = inter.id || inter.numero || 'i_' + Date.now();
  return fbSet(COL.INTERVENTIONS, id, { ...inter, id });
}
async function fbUpdateIntervention(inter) {
  return fbSet(COL.INTERVENTIONS, inter.id, inter);
}
async function fbDeleteIntervention(interId) {
  return fbDelete(COL.INTERVENTIONS, interId);
}
async function fbLoadInterventions() {
  return await fbGetAll(COL.INTERVENTIONS);
}
function fbListenInterventions(callback) {
  fbListen(COL.INTERVENTIONS, callback);
}

// --- COSSIM CONFIG ---
async function fbSaveCossimConfig(config) {
  return fbSet(COL.COSSIM_CONFIG, 'main', config);
}
async function fbLoadCossimConfig() {
  return await fbGet(COL.COSSIM_CONFIG, 'main');
}

// --- BIP ALERTES ---
async function fbSendBip(userId, bipData) {
  return fbSet(COL.BIP_ALERTES, userId, { ...bipData, userId, timestamp: Date.now() });
}
async function fbGetBip(userId) {
  return await fbGet(COL.BIP_ALERTES, userId);
}
async function fbClearBip(userId) {
  return fbDelete(COL.BIP_ALERTES, userId);
}
function fbListenBip(userId, callback) {
  if (!_db) return;
  const key = 'bip_' + userId;
  if (_listeners[key]) _listeners[key]();
  _listeners[key] = _db.collection(COL.BIP_ALERTES).doc(userId).onSnapshot(snap => {
    callback(snap.exists ? snap.data() : null);
  });
}

// --- FEUILLES DE GARDE ---
async function fbSaveFeuille(date, feuille) {
  return fbSet(COL.FEUILLES, date, feuille);
}
async function fbLoadFeuilles() {
  const docs = await fbGetAll(COL.FEUILLES);
  const result = {};
  docs.forEach(d => { result[d._id] = d; });
  return result;
}
async function fbDeleteFeuille(date) {
  return fbDelete(COL.FEUILLES, date);
}

// --- BLIPS CARTO ---
async function fbSaveBlips(blips) {
  return fbSet(COL.BLIPS, 'main', { data: blips });
}
async function fbLoadBlips() {
  const doc = await fbGet(COL.BLIPS, 'main');
  return doc?.data || [];
}

// ============================================================
// MIGRATION LOCALSTORAGE → FIREBASE (première installation)
// ============================================================
async function migrateFromLocalStorage() {
  if (!_db) return;
  console.log("🔄 Migration localStorage → Firebase...");

  const migrate = async (lsKey, saveFn) => {
    const raw = localStorage.getItem(lsKey);
    if (raw) {
      try {
        const data = JSON.parse(raw);
        await saveFn(data);
        console.log(`✅ Migré: ${lsKey}`);
      } catch(e) { console.warn(`❌ Migration erreur ${lsKey}:`, e); }
    }
  };

  await migrate('systel_config',       fbSaveConfig);
  await migrate('systel_casernes',     fbSaveCasernes);
  await migrate('systel_engins',       fbSaveEngins);
  await migrate('systel_cossim_config',fbSaveCossimConfig);
  await migrate('systel_blips',        (b) => fbSaveBlips(b));

  // Users — sauvegarder chacun séparément
  const usersRaw = localStorage.getItem('systel_users');
  if (usersRaw) {
    const users = JSON.parse(usersRaw);
    for (const u of users) await fbSaveUser(u);
    console.log(`✅ ${users.length} users migrés`);
  }

  // Interventions — sauvegarder chacune séparément
  const ivRaw = localStorage.getItem('systel_interventions');
  if (ivRaw) {
    const ivs = JSON.parse(ivRaw);
    for (const iv of ivs) await fbSaveIntervention(iv);
    console.log(`✅ ${ivs.length} interventions migrées`);
  }

  // Feuilles de garde
  const fgRaw = localStorage.getItem('systel_feuilles_garde');
  if (fgRaw) {
    const fg = JSON.parse(fgRaw);
    for (const [date, feuille] of Object.entries(fg)) await fbSaveFeuille(date, feuille);
    console.log(`✅ Feuilles de garde migrées`);
  }

  localStorage.setItem('systel_migrated_to_firebase', 'true');
  console.log("✅ Migration complète !");
}
// ============================================================
// SYNCHRONISATION DE PRÉSENCE (Dispo/Indispo)
// ============================================================

async function fbUpdatePresence(userId, status) {
  if (!_db) return;
  try {
    await _db.collection(COL.USERS).doc(userId).update({
      presence: status,
      lastUpdate: new Date().toISOString()
    });
    console.log("✅ Présence mise à jour:", userId, status);
  } catch(e) {
    console.warn("Erreur mise à jour présence:", e);
  }
}

function fbListenPresence(callback) {
  if (!_db) return;
  try {
    _listeners.presence = _db.collection(COL.USERS)
      .onSnapshot(snapshot => {
        const users = [];
        snapshot.forEach(doc => {
          users.push({ id: doc.id, ...doc.data() });
        });
        callback(users);
      });
    console.log("✅ Écouteur présence activé");
  } catch(e) {
    console.warn("Erreur écouteur présence:", e);
  }
}

// ============================================================
// SYSTÈME DE BIP/ALERTES SYNCHRONISÉ
// ============================================================

async function fbTriggerBip(targetUserId, bipType = 'standard') {
  if (!_db) return;
  try {
    const alertId = Date.now().toString();
    await _db.collection(COL.BIP_ALERTES).doc(alertId).set({
      targetUserId: targetUserId,
      type: bipType,
      timestamp: new Date().toISOString(),
      read: false
    });
    console.log("✅ Alerte bip envoyée à:", targetUserId);
  } catch(e) {
    console.warn("Erreur envoi bip:", e);
  }
}

function fbListenBipAlerts(userId, callback) {
  if (!_db) return;
  try {
    _listeners.bip = _db.collection(COL.BIP_ALERTES)
      .where('targetUserId', '==', userId)
      .where('read', '==', false)
      .onSnapshot(snapshot => {
        snapshot.forEach(doc => {
          callback(doc.data());
          // Marquer comme lue
          _db.collection(COL.BIP_ALERTES).doc(doc.id).update({ read: true });
        });
      });
    console.log("✅ Écouteur bip activé pour:", userId);
  } catch(e) {
    console.warn("Erreur écouteur bip:", e);
  }
}

// ============================================================
// NETTOYAGE DES LISTENERS
// ============================================================

function fbStopListeners() {
  Object.values(_listeners).forEach(listener => {
    if (typeof listener === 'function') listener();
  });
  _listeners = {};
  console.log("✅ Tous les écouteurs arrêtés");
}

// ===== OPTIMISATION BIPS - VERSION ROBUSTE =====
function fbListenBipAlertsOptimized(userId, callback) {
  if (!_db) {
    console.warn("Firebase pas prêt pour les bips");
    return;
  }
  
  try {
    // Écouter TOUS les bips (pas seulement les non-lus)
    _listeners.bipOptimized = _db.collection(COL.BIP_ALERTES)
      .where('targetUserId', '==', userId)
      .orderBy('timestamp', 'desc')
      .limit(50)
      .onSnapshot(snapshot => {
        snapshot.docChanges().forEach(change => {
          if (change.type === 'added') {
            const alert = change.doc.data();
            console.log("✅ Nouveau bip détecté:", alert);
            
            // Callback immédiat
            callback(alert);
            
            // Marquer comme lu après traitement
            setTimeout(() => {
              _db.collection(COL.BIP_ALERTES).doc(change.doc.id).update({ read: true })
                .catch(e => console.warn("Erreur marquage bip:", e));
            }, 100);
          }
        });
      }, (error) => {
        console.error("❌ Erreur écouteur bips:", error);
      });
    
    console.log("✅ Écouteur bips optimisé activé pour:", userId);
  } catch(e) {
    console.error("❌ Erreur setup écouteur bips:", e);
  }
}

// ===== TEST DE PERMISSIONS FIREBASE =====
async function fbTestPermissions() {
  if (!_db) return { canRead: false, canWrite: false, error: "Firebase non connecté" };
  
  try {
    const testDoc = {
      testId: 'permission_test_' + Date.now(),
      timestamp: new Date().toISOString()
    };
    
    // Test d'écriture
    try {
      await _db.collection('systel_test_permissions').doc(testDoc.testId).set(testDoc);
      console.log("✅ Écriture Firebase OK");
    } catch(e) {
      console.error("❌ Écriture Firebase BLOQUÉE:", e.message);
      return { canRead: false, canWrite: false, error: "Écriture refusée: " + e.message };
    }
    
    // Test de lecture
    try {
      const snap = await _db.collection('systel_test_permissions').doc(testDoc.testId).get();
      if (snap.exists) {
        console.log("✅ Lecture Firebase OK");
        // Nettoyer le test
        await _db.collection('systel_test_permissions').doc(testDoc.testId).delete();
        return { canRead: true, canWrite: true, error: null };
      }
    } catch(e) {
      console.error("❌ Lecture Firebase BLOQUÉE:", e.message);
      return { canRead: false, canWrite: true, error: "Lecture refusée: " + e.message };
    }
  } catch(e) {
    console.error("❌ Erreur test permissions:", e);
    return { canRead: false, canWrite: false, error: e.message };
  }
}

// ===== SYSTÈME HEARTBEAT (Battement de Cœur) =====
let heartbeatInterval = null;

function startHeartbeat(userId) {
  if (heartbeatInterval) clearInterval(heartbeatInterval);
  
  // Envoyer un heartbeat toutes les 30 secondes
  heartbeatInterval = setInterval(async () => {
    if (!_db || !userId) return;
    
    try {
      await _db.collection(COL.USERS).doc(userId).update({
        lastHeartbeat: new Date().toISOString(),
        online: true
      });
      console.log("💓 Heartbeat envoyé pour:", userId);
    } catch(e) {
      console.warn("Erreur heartbeat:", e);
    }
  }, 30000);
  
  // Envoyer immédiatement un heartbeat
  fbSendHeartbeat(userId);
}

async function fbSendHeartbeat(userId) {
  if (!_db || !userId) return;
  try {
    await _db.collection(COL.USERS).doc(userId).update({
      lastHeartbeat: new Date().toISOString(),
      online: true
    });
  } catch(e) {
    console.warn("Erreur envoi heartbeat:", e);
  }
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
}

// ===== SYNCHRONISATION FEUILLES DE GARDE =====

async function fbSaveFeuille(feuille) {
  if (!_db) return;
  try {
    const feuillleId = feuille.id || 'feuille_' + Date.now();
    await _db.collection(COL.FEUILLES).doc(feuillleId).set(feuille, { merge: true });
    console.log("✅ Feuille de garde sauvegardée:", feuillleId);
    return feuillleId;
  } catch(e) {
    console.error("❌ Erreur sauvegarde feuille:", e);
  }
}

function fbListenFeuilles(callback) {
  if (!_db) return;
  try {
    _listeners.feuilles = _db.collection(COL.FEUILLES)
      .onSnapshot(snapshot => {
        const feuilles = [];
        snapshot.forEach(doc => {
          feuilles.push({ id: doc.id, ...doc.data() });
        });
        callback(feuilles);
        console.log("✅ Feuilles de garde synchronisées:", feuilles.length);
      }, (error) => {
        console.error("❌ Erreur écouteur feuilles:", error);
      });
  } catch(e) {
    console.error("❌ Erreur setup écouteur feuilles:", e);
  }
}

// ===== SYNCHRONISATION PLANNING =====

async function fbSavePlanning(userId, planning) {
  if (!_db) return;
  try {
    await _db.collection(COL.PLANNING).doc(userId).set(planning, { merge: true });
    console.log("✅ Planning sauvegardé pour:", userId);
  } catch(e) {
    console.error("❌ Erreur sauvegarde planning:", e);
  }
}

function fbListenPlanning(callback) {
  if (!_db) return;
  try {
    _listeners.planning = _db.collection(COL.PLANNING)
      .onSnapshot(snapshot => {
        const planning = {};
        snapshot.forEach(doc => {
          planning[doc.id] = doc.data();
        });
        callback(planning);
        console.log("✅ Planning synchronisé");
      }, (error) => {
        console.error("❌ Erreur écouteur planning:", error);
      });
  } catch(e) {
    console.error("❌ Erreur setup écouteur planning:", e);
  }
}

// ===== SYNCHRONISATION INTERVENTIONS =====

function fbListenInterventions(callback) {
  if (!_db) return;
  try {
    _listeners.interventions = _db.collection(COL.INTERVENTIONS)
      .onSnapshot(snapshot => {
        const interventions = [];
        snapshot.forEach(doc => {
          interventions.push({ id: doc.id, ...doc.data() });
        });
        callback(interventions);
        console.log("✅ Interventions synchronisées:", interventions.length);
      }, (error) => {
        console.error("❌ Erreur écouteur interventions:", error);
      });
  } catch(e) {
    console.error("❌ Erreur setup écouteur interventions:", e);
  }
}

// ===== SYNCHRONISATION ENGINS =====

function fbListenEngins(callback) {
  if (!_db) return;
  try {
    _listeners.engins = _db.collection(COL.ENGINS)
      .onSnapshot(snapshot => {
        const engins = [];
        snapshot.forEach(doc => {
          engins.push({ id: doc.id, ...doc.data() });
        });
        callback(engins);
        console.log("✅ Engins synchronisés:", engins.length);
      }, (error) => {
        console.error("❌ Erreur écouteur engins:", error);
      });
  } catch(e) {
    console.error("❌ Erreur setup écouteur engins:", e);
  }
}

// ===== FORÇAGE DE SYNCHRONISATION BIDIRECTIONNELLE =====
async function fbForceSync() {
  if (!_db) return console.warn("Firebase pas prêt");
  
  try {
    console.log("🔄 Synchronisation forcée en cours...");
    
    // Envoyer les engins
    if (ENGINS && Array.isArray(ENGINS)) {
      for (const engin of ENGINS) {
        await _db.collection(COL.ENGINS).doc(engin.id || engin.code).set(engin, { merge: true });
      }
      console.log("✅ Engins synchronisés:", ENGINS.length);
    }
    
    // Envoyer les interventions
    if (INTERVENTIONS && Array.isArray(INTERVENTIONS)) {
      for (const iv of INTERVENTIONS) {
        await _db.collection(COL.INTERVENTIONS).doc(iv.id || iv.numero).set(iv, { merge: true });
      }
      console.log("✅ Interventions synchronisées:", INTERVENTIONS.length);
    }
    
    // Envoyer les feuilles de garde
    if (FEUILLES_GARDE && Array.isArray(FEUILLES_GARDE)) {
      for (const feuille of FEUILLES_GARDE) {
        await _db.collection(COL.FEUILLES).doc(feuille.id || Date.now().toString()).set(feuille, { merge: true });
      }
      console.log("✅ Feuilles de garde synchronisées:", FEUILLES_GARDE.length);
    }
    
    console.log("✅ Synchronisation forcée terminée!");
  } catch(e) {
    console.error("❌ Erreur synchronisation forcée:", e);
  }
}

// Lancer une synchronisation forcée toutes les 2 minutes
setInterval(() => {
  if (_fbReady) fbForceSync().catch(e => console.warn("Erreur sync périodique:", e));
}, 120000);
