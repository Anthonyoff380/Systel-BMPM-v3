/* ============================================================
   SYSTEL POMPIERS - APP JS (PTR VERSION v18)
   ============================================================ */

document.addEventListener('DOMContentLoaded', async () => {
  // Tenter d'initialiser Firebase si FIREBASE_CONFIG est défini
  if (typeof FIREBASE_CONFIG !== 'undefined') {
    initFirebase();
    onFirebaseReady(async () => {
      updateFBIndicator();
      console.log("Chargement des données depuis Firebase...");
      const fbUsers = await fbLoadUsers();
      if (fbUsers && fbUsers.length > 0) {
        USERS = fbUsers;
        localStorage.setItem('systel_users', JSON.stringify(USERS));
        synchroniserTout();
      }
    });
  }

  chargerDonnees();
  synchroniserTout();
  checkAuth();
  updateFBIndicator();
  startClock();
  setTimeout(startSynopDiscordTimer, 2000);
  // Hash pour détecter les modifs externes (autre onglet)
  let _lastSaveKey = '';
  setInterval(() => {
    // Ne recharger depuis localStorage QUE si une autre instance a sauvegardé
    const currentKey = localStorage.getItem('systel_save_ts') || '';
    if (currentKey !== _lastSaveKey) {
      chargerDonnees();
      _lastSaveKey = currentKey;
    }
    const section = document.querySelector('.section.active-section');
    if (section) {
      const id = section.id.replace('section-', '');
      if (id === 'synoptique') updateSynoptique();
      if (id === 'interventions') renderInterventionsSynoptique();
      if (id === 'planning') renderPlanning();
      if (id === 'feuille-garde') renderFeuilleGarde();
    }
    checkBipAlertes();
  }, 2000);
});

function ouvrirConfigFirebase() {
  const saved = localStorage.getItem('systel_firebase_config');
  if (saved) document.getElementById('fb-config-json').value = saved;
  ouvrirModal('modal-fb-config');
}

function sauvegarderConfigFirebase() {
  const json = document.getElementById('fb-config-json').value.trim();
  const err = document.getElementById('fb-config-error');
  try {
    if (json) {
      JSON.parse(json); // Test validité
      localStorage.setItem('systel_firebase_config', json);
    } else {
      localStorage.removeItem('systel_firebase_config');
    }
    location.reload(); // Recharger pour appliquer
  } catch(e) {
    err.style.display = 'block';
  }
}

function updateFBIndicator() {
  const dot = document.getElementById('fb-dot');
  const txt = document.getElementById('fb-text');
  if (!dot || !txt) return;
  if (_fbReady) {
    dot.style.background = '#48bb78';
    txt.textContent = 'Cloud (Connecté)';
  } else {
    dot.style.background = '#e53e3e';
    txt.textContent = 'Local (Hors-ligne)';
  }
}

function synchroniserTout() {
  USERS.forEach(u => {
    if (!u.tel) u.tel = "06 XX XX XX XX";
    if (!u.email) u.email = `${u.id}@ptr.fr`;
    if (!u.grade) u.grade = (userIsAdmin(u) ? 'Officier' : 'Sapeur');
    if (!u.roles) u.roles = [u.role || 'BMPM'];
    if (!u.role) u.role = u.roles[0];
    if (u.name && !u.lastname) {
      const parts = u.name.split(' ');
      u.lastname = parts[0].toUpperCase();
      u.firstname = parts.slice(1).join(' ');
    }
  });
  PERSONNELS = USERS.map(u => ({
    id: u.id,
    nom: u.lastname || u.id.toUpperCase(),
    prenom: u.firstname || "",
    grade: u.grade,
    statut: (sessionStorage.getItem('systel_user') && JSON.parse(sessionStorage.getItem('systel_user')).id === u.id) ? "DISPO" : "INDISPO",
    photo: u.photo
  }));
  ANNUAIRE = USERS.map(u => ({
    id: u.id,
    nom: `${u.lastname || ""} ${u.firstname || ""}`.trim() || u.name,
    grade: u.grade,
    tel: u.tel,
    email: u.email,
    photo: u.photo
  }));
  USERS.forEach(u => { if (!PLANNING[u.id]) PLANNING[u.id] = {}; });
  sauvegarderDonnees();
}

// ===== AUTH =====
function checkAuth() {
  const savedUser = sessionStorage.getItem('systel_user');
  if (savedUser) {
    const parsed = JSON.parse(savedUser);
    currentUser = USERS.find(u => u.id === parsed.id) || USERS[0];
    initApp();
  } else {
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
    document.body.classList.add('login-page');
  }
}

function handleLogin(e) {
  e.preventDefault();
  const id = (document.getElementById('login-id').value || '').trim();
  const pwd = (document.getElementById('login-pwd').value || '').trim();
  
  // Recharger depuis localStorage pour avoir les derniers comptes créés localement
  const storedUsers = localStorage.getItem('systel_users');
  if (storedUsers) {
    try {
      const parsed = JSON.parse(storedUsers);
      if (parsed && Array.isArray(parsed)) USERS = parsed;
    } catch(ex) {}
  }

  // FORCE ADMIN : Toujours s'assurer que l'admin par défaut est présent si rien d'autre ne marche
  const defaultAdmin = { id:'admin', name:'ADMINISTRATEUR', lastname:'ADMIN', firstname:'Système', pwd:'123', roles:['ADMIN'], role:'ADMIN', grade:'Officier', tel:'', email:'', photo:null };
  if (!USERS.find(u => u.id === 'admin')) {
    USERS.push(defaultAdmin);
  }

  const idLow = id.toLowerCase();
  
  // Recherche prioritaire par ID exact (plus robuste pour l'admin)
  let user = USERS.find(u => (u.id || '').toLowerCase() === idLow && u.pwd === pwd);
  
  // Si non trouvé, recherche par alias/nom
  if (!user) {
    user = USERS.find(u => {
      if (u.pwd !== pwd) return false;
      const fn = (u.firstname || '').toLowerCase();
      const ln = (u.lastname || u.name || '').toLowerCase().split(' ')[0];
      return fn === idLow || ln === idLow ||
             `${fn}.${ln}` === idLow || `${ln}.${fn}` === idLow ||
             `${fn}${ln}` === idLow;
    });
  }

  if (user) {
    currentUser = user;
    localStorage.setItem('systel_current_user_id', user.id);
    sessionStorage.setItem('systel_user', JSON.stringify(user));
    synchroniserTout();
    initApp();
  } else {
    document.getElementById('login-error').textContent = "Identifiant ou mot de passe incorrect.";
  }
}

function handleLogout() { sessionStorage.removeItem('systel_user'); synchroniserTout(); location.reload(); }

function initApp() {
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('app-container').style.display = 'flex';
  document.body.classList.remove('login-page');
  const displayName = `${currentUser.lastname || ""} ${currentUser.firstname || ""}`.trim() || currentUser.name;
  document.getElementById('user-display-name').textContent = displayName;
  document.getElementById('top-avatar-img').src = currentUser.photo || 'https://www.w3schools.com/howto/img_avatar.png';
  const badge = document.getElementById('user-role-badge');
  const rolesDisplay = (currentUser.roles || [currentUser.role]).join(' | ');
  badge.textContent = rolesDisplay;
  badge.className = 'badge ' + (userIsAdmin(currentUser) ? 'badge-danger' : userIsSOG(currentUser) ? 'badge-warning' : userHasCOSSIM(currentUser) ? 'badge-primary' : 'badge-info');
  document.getElementById('nav-admin').style.display = userIsAdmin(currentUser) ? 'flex' : 'none';
  const navCossim = document.getElementById('nav-cossim');
  if (navCossim) navCossim.style.display = userHasCOSSIM(currentUser) ? 'flex' : 'none';
  const btnCossim = document.getElementById('btn-ouvrir-cossim');
  if (btnCossim) btnCossim.style.display = userHasCOSSIM(currentUser) ? 'inline-block' : 'none';
  initDate();
  showSection('synoptique');
  // Appliquer thème sauvegardé
  const theme = localStorage.getItem('systel_theme') || 'night';
  applyTheme(theme);
}

// ===== THEME JOUR/NUIT =====
function applyTheme(theme) {
  document.body.setAttribute('data-theme', theme);
  localStorage.setItem('systel_theme', theme);
  const btn = document.getElementById('theme-toggle-btn');
  if (btn) btn.textContent = theme === 'day' ? '🌙' : '☀️';
}
function toggleTheme() {
  const current = localStorage.getItem('systel_theme') || 'night';
  applyTheme(current === 'day' ? 'night' : 'day');
}

// ===== NAVIGATION =====
function showSection(name) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active-section'));
  const target = document.getElementById('section-' + name);
  if (target) target.classList.add('active-section');
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('selected');
    if (item.dataset.section === name) item.classList.add('selected');
  });
  if (name === 'synoptique') updateSynoptique();
  if (name === 'interventions') renderInterventionsSynoptique();
  if (name === 'historique') renderHistorique();
  if (name === 'planning') renderPlanning();
  if (name === 'annuaire') renderAnnuaire();
  if (name === 'cartographie') initCartographie();
  if (name === 'feuille-garde') renderFeuilleGarde();
  if (name === 'admin') showAdminTab('centre');
}

function openProfilMenu() {
  document.getElementById('prof-name').textContent = `${currentUser.lastname || ""} ${currentUser.firstname || ""}`.trim() || currentUser.name;
  document.getElementById('prof-grade').textContent = currentUser.grade;
  document.getElementById('prof-role').textContent = (currentUser.roles || [currentUser.role]).join(', ');
  document.getElementById('prof-img').src = currentUser.photo || 'https://www.w3schools.com/howto/img_avatar.png';
  ouvrirModal('modal-profil');
}

// ===== ADMIN TABS =====
function showAdminTab(tabName, evt) {
  document.querySelectorAll('.admin-tab-content').forEach(tab => tab.style.display = 'none');
  document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
  const target = document.getElementById(`admin-tab-${tabName}`);
  if (target) target.style.display = 'block';
  if (evt) evt.target.classList.add('active');
  else { const b = document.querySelector(`.admin-tab-btn[data-tab="${tabName}"]`); if (b) b.classList.add('active'); }
  if (tabName === 'users') renderAdminUsers();
  if (tabName === 'engins') renderAdminEngins();
  if (tabName === 'casernes') renderAdminCasernes();
  if (tabName === 'intranet') renderAdminIntranet();
  if (tabName === 'cossim') renderAdminCossim();
  if (tabName === 'centre') {
    document.getElementById('adm-centre-nom').value = CONFIG.nom;
    document.getElementById('adm-centre-code').value = CONFIG.centre;
  }
  if (tabName === 'grades') setTimeout(renderAdminGrades, 50);
  if (tabName === 'webhooks') setTimeout(() => {
    const wh = CONFIG?.webhooks || {};
    const g = id => document.getElementById(id);
    if(g('wh-ticket')) g('wh-ticket').value = wh.ticket||'';
    if(g('wh-intervention')) g('wh-intervention').value = wh.intervention||'';
    if(g('wh-synoptique')) g('wh-synoptique').value = wh.synoptique||'';
  }, 50);
}

function renderAdminIntranet() {
  const container = document.getElementById('adm-intranet-list');
  container.innerHTML = INTRANET_CONFIG.items.map((item, idx) => `
    <div class="card mb-10"><div class="card-body">
      <div class="form-group"><label>Titre (${item.id})</label><input type="text" value="${item.title}" onchange="INTRANET_CONFIG.items[${idx}].title=this.value; sauvegarderDonnees();"></div>
      <div class="form-group"><label>Description</label><input type="text" value="${item.desc}" onchange="INTRANET_CONFIG.items[${idx}].desc=this.value; sauvegarderDonnees();"></div>
      <div class="form-group"><label>URL Image</label><input type="text" value="${item.img}" onchange="INTRANET_CONFIG.items[${idx}].img=this.value; sauvegarderDonnees();"></div>
    </div></div>
  `).join('');
}

// ===== ADMIN COSSIM CONFIG =====
function renderAdminCossim() {
  chargerDonnees();
  const c = document.getElementById('admin-tab-cossim');
  if (!c) return;
  c.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
      <!-- Communes -->
      <div class="card"><div class="card-header">🏙️ Communes</div><div class="card-body">
        <div id="adm-communes-list" style="max-height:200px;overflow-y:auto;margin-bottom:10px;"></div>
        <div style="display:flex;gap:8px;">
          <input type="text" id="adm-new-commune" placeholder="Nouvelle commune..." style="flex:1;">
          <button class="btn btn-success btn-sm" onclick="addCossimItem('communes','adm-new-commune')">+</button>
        </div>
      </div></div>

      <!-- ERP -->
      <div class="card"><div class="card-header">🏢 Établissements répertoriés (ERP)</div><div class="card-body">
        <div id="adm-erp-list" style="max-height:200px;overflow-y:auto;margin-bottom:10px;"></div>
        <div style="display:flex;gap:8px;">
          <input type="text" id="adm-new-erp" placeholder="Nouvel ERP..." style="flex:1;">
          <button class="btn btn-success btn-sm" onclick="addCossimItem('erp','adm-new-erp')">+</button>
        </div>
      </div></div>

      <!-- Services -->
      <div class="card"><div class="card-header">👥 Services concernés</div><div class="card-body">
        <div id="adm-services-list" style="max-height:200px;overflow-y:auto;margin-bottom:10px;"></div>
        <div style="display:flex;gap:8px;">
          <input type="text" id="adm-new-service" placeholder="Nouveau service..." style="flex:1;">
          <button class="btn btn-success btn-sm" onclick="addCossimItem('services','adm-new-service')">+</button>
        </div>
      </div></div>

      <!-- Catégories Sinistres -->
      <div class="card"><div class="card-header">⚠️ Catégories & Sinistres</div><div class="card-body">
        <div id="adm-sinistres-list" style="max-height:350px;overflow-y:auto;margin-bottom:10px;"></div>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <input type="text" id="adm-new-cat" placeholder="Nouvelle catégorie..." style="flex:1;">
          <button class="btn btn-primary btn-sm" onclick="addCossimCategorie()">+ Catégorie</button>
        </div>
      </div></div>
      <!-- GFO Types -->
      <div class="card" style="grid-column:1/-1;"><div class="card-header">🚒 Types de départ (GFO)</div><div class="card-body">
        <div id="adm-gfo-list" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;"></div>
        <div style="display:flex;gap:8px;">
          <input type="text" id="adm-new-gfo" placeholder="Ex: PROMPT_SAP, G-INC..." style="flex:1;">
          <button class="btn btn-success btn-sm" onclick="addCossimGFO()">+</button>
        </div>
      </div></div>
    </div>
  `;
  refreshAdminCossimLists();
}

function refreshAdminCossimLists() {
  // Communes
  const cl = document.getElementById('adm-communes-list');
  if (cl) cl.innerHTML = COSSIM_CONFIG.communes.map((v,i) => `
    <div class="adm-list-item"><span>${v}</span>
    <button class="btn btn-danger btn-sm" onclick="removeCossimItem('communes',${i})">✕</button></div>`).join('');

  // ERP avec consignes
  const el = document.getElementById('adm-erp-list');
  if (el) el.innerHTML = COSSIM_CONFIG.erp.map((v,i) => {
    const consigne = COSSIM_CONFIG.erp_consignes?.[v] || '';
    return `<div style="margin-bottom:8px;border:1px solid var(--border-color);border-radius:6px;overflow:hidden;">
      <div class="adm-list-item" style="border-bottom:${consigne?'1px solid var(--border-color)':'none'};">
        <strong style="font-size:13px;">${v}</strong>
        <button class="btn btn-danger btn-sm" onclick="removeCossimItem('erp',${i})">✕</button>
      </div>
      <div style="padding:4px 10px;display:flex;gap:6px;align-items:center;">
        <input type="text" value="${consigne.replace(/"/g,'&quot;')}" placeholder="Consigne pour cet ERP..."
          style="flex:1;font-size:11px;padding:3px 6px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-main);color:var(--text-color);"
          onchange="majConsigneERP('${v.replace(/'/g,"\\'")}', this.value)">
      </div>
    </div>`;
  }).join('');

  // Services
  const sl = document.getElementById('adm-services-list');
  if (sl) sl.innerHTML = COSSIM_CONFIG.services.map((v,i) => `
    <div class="adm-list-item"><span>${v}</span>
    <button class="btn btn-danger btn-sm" onclick="removeCossimItem('services',${i})">✕</button></div>`).join('');

  // GFO Types
  const gfol = document.getElementById('adm-gfo-list');
  if (gfol) gfol.innerHTML = (COSSIM_CONFIG.gfo_types||[]).map((v,i) => `
    <span style="display:flex;align-items:center;gap:4px;background:var(--bg-main);border:1px solid var(--border-color);border-radius:5px;padding:3px 8px;font-size:12px;font-weight:700;">
      ${v}<button style="border:none;background:none;color:#e53e3e;cursor:pointer;font-size:11px;padding:0 2px;" onclick="removeCossimGFO(${i})">✕</button>
    </span>`).join('');

  // Sinistres par catégorie
  const sinl = document.getElementById('adm-sinistres-list');
  if (sinl) sinl.innerHTML = COSSIM_CONFIG.categories_sinistres.map((cat, ci) => `
    <div style="margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <strong style="font-size:13px;color:var(--accent);">${cat.nom}</strong>
        <button class="btn btn-danger btn-sm" onclick="removeCossimCategorie(${ci})">✕ Cat.</button>
      </div>
      ${cat.sinistres.map((s,si) => `
        <div class="adm-list-item" style="padding:4px 8px;margin-left:10px;">
          <span style="font-size:12px;">${s}</span>
          <button class="btn btn-danger btn-sm" onclick="removeCossimSinistre(${ci},${si})">✕</button>
        </div>`).join('')}
      <div style="display:flex;gap:6px;margin-top:6px;margin-left:10px;">
        <input type="text" id="new-sin-${ci}" placeholder="Nouveau sinistre..." style="flex:1;font-size:12px;padding:4px 8px;">
        <button class="btn btn-success btn-sm" onclick="addCossimSinistre(${ci})">+</button>
      </div>
    </div>
  `).join('');
}

function addCossimItem(key, inputId) {
  const val = document.getElementById(inputId)?.value.trim();
  if (!val) return;
  COSSIM_CONFIG[key].push(val);
  document.getElementById(inputId).value = '';
  sauvegarderDonnees();
  refreshAdminCossimLists();
}
function majConsigneERP(erpNom, consigne) {
  if (!COSSIM_CONFIG.erp_consignes) COSSIM_CONFIG.erp_consignes = {};
  COSSIM_CONFIG.erp_consignes[erpNom] = consigne;
  sauvegarderDonnees();
}
function removeCossimItem(key, idx) {
  COSSIM_CONFIG[key].splice(idx, 1);
  sauvegarderDonnees();
  refreshAdminCossimLists();
}
function addCossimGFO() {
  const val = document.getElementById('adm-new-gfo')?.value.trim().toUpperCase();
  if (!val) return;
  if (!COSSIM_CONFIG.gfo_types) COSSIM_CONFIG.gfo_types = [];
  COSSIM_CONFIG.gfo_types.push(val);
  document.getElementById('adm-new-gfo').value = '';
  sauvegarderDonnees(); refreshAdminCossimLists();
}
function removeCossimGFO(idx) {
  COSSIM_CONFIG.gfo_types.splice(idx, 1);
  sauvegarderDonnees(); refreshAdminCossimLists();
}
function addCossimCategorie() {
  const nom = document.getElementById('adm-new-cat')?.value.trim();
  if (!nom) return;
  COSSIM_CONFIG.categories_sinistres.push({ id: nom.toLowerCase().replace(/\s+/g,'-'), nom: nom.toUpperCase(), sinistres: [] });
  document.getElementById('adm-new-cat').value = '';
  sauvegarderDonnees();
  refreshAdminCossimLists();
}
function removeCossimCategorie(ci) {
  if (confirm('Supprimer cette catégorie ?')) {
    COSSIM_CONFIG.categories_sinistres.splice(ci, 1);
    sauvegarderDonnees();
    refreshAdminCossimLists();
  }
}
function addCossimSinistre(ci) {
  const val = document.getElementById(`new-sin-${ci}`)?.value.trim();
  if (!val) return;
  COSSIM_CONFIG.categories_sinistres[ci].sinistres.push(val);
  sauvegarderDonnees();
  refreshAdminCossimLists();
}
function removeCossimSinistre(ci, si) {
  COSSIM_CONFIG.categories_sinistres[ci].sinistres.splice(si, 1);
  sauvegarderDonnees();
  refreshAdminCossimLists();
}

// ===== ADMIN USERS =====
function renderAdminUsers() {
  const tbody = document.getElementById('adm-users-list');
  tbody.innerHTML = USERS.map((u, idx) => `
    <tr>
      <td><div class="avatar-sm"><img src="${u.photo || 'https://www.w3schools.com/howto/img_avatar.png'}"></div></td>
      <td>${u.id}</td>
      <td>${u.lastname || u.name}</td>
      <td>${(u.roles || [u.role]).join(', ')}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editUserAdmin(${idx})">Modifier</button>
        <button class="btn btn-danger btn-sm" onclick="deleteUserAdmin(${idx})">✕</button>
      </td>
    </tr>
  `).join('');
}

let currentEditIdx = null;
function ajouterUserAdmin() {
  currentEditIdx = null;
  const g = id => document.getElementById(id);
  if(g('mu-id')) g('mu-id').value = '';
  if(g('mu-lastname')) g('mu-lastname').value = '';
  if(g('mu-firstname')) g('mu-firstname').value = '';
  if(g('mu-pwd')) g('mu-pwd').value = '';
  if(g('mu-photo-data')) g('mu-photo-data').value = '';
  refreshGradeSelect();
  if(g('mu-grade')) g('mu-grade').value = (CONFIG.grades_custom||['Sapeur'])[0] || 'Sapeur';
  // Photo par défaut
  const prev = document.getElementById('mu-photo-display');
  if(prev) prev.src = 'https://ui-avatars.com/api/?name=Nouveau&background=2d3748&color=fff&size=80';
  renderRolesCheckboxes([]);
  ouvrirModal('modal-user-admin');
}
function editUserAdmin(idx) {
  currentEditIdx = idx;
  const u = USERS[idx];
  const g = id => document.getElementById(id);
  if(g('mu-id')) g('mu-id').value = u.id;
  if(g('mu-lastname')) g('mu-lastname').value = u.lastname || u.name || '';
  if(g('mu-firstname')) g('mu-firstname').value = u.firstname || '';
  if(g('mu-pwd')) g('mu-pwd').value = u.pwd;
  if(g('mu-photo-data')) g('mu-photo-data').value = u.photo || '';
  refreshGradeSelect();
  if(g('mu-grade')) g('mu-grade').value = u.grade || '';
  // Afficher photo
  const prev = document.getElementById('mu-photo-display');
  if(prev) prev.src = u.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent((u.firstname||'?')+' '+(u.lastname||''))}&background=2d3748&color=fff&size=80`;
  renderRolesCheckboxes(u.roles || [u.role]);
  ouvrirModal('modal-user-admin');
}
function renderRolesCheckboxes(selectedRoles) {
  const container = document.getElementById('mu-roles-container');
  container.innerHTML = ROLES_DISPONIBLES.map(r => `
    <label style="display:inline-flex;align-items:center;gap:6px;margin-right:15px;cursor:pointer;">
      <input type="checkbox" value="${r}" ${selectedRoles.includes(r) ? 'checked' : ''}> ${r}
    </label>
  `).join('');
}
function getSelectedRoles() {
  return Array.from(document.querySelectorAll('#mu-roles-container input:checked')).map(cb => cb.value);
}
// ===== GRADES ADMIN =====
const GRADES_SP_DEFAUT = ['Sapeur','SA1 Cls','SA2 Cls','Caporal','Caporal-Chef','Sergent','Sergent-Chef','Adjudant','Adjudant-Chef','Major','BCH','Lieutenant','Capitaine','Commandant','Lieutenant-Colonel','Colonel'];
const GRADES_SSSM_DEFAUT = ['Médecin','Pharmacien','Infirmier','Infirmier Anesthésiste','IDE','Aide-Soignant','Brancardier'];

function renderAdminGrades() {
  const container = document.getElementById('admin-tab-grades');
  if (!container) return;
  if (!CONFIG.grades_custom || CONFIG.grades_custom.length === 0) {
    CONFIG.grades_custom = [...GRADES_SP_DEFAUT, ...GRADES_SSSM_DEFAUT];
    sauvegarderDonnees();
  }
  if (!CONFIG.grades_sp) CONFIG.grades_sp = [...GRADES_SP_DEFAUT];
  if (!CONFIG.grades_sssm) CONFIG.grades_sssm = [...GRADES_SSSM_DEFAUT];

  const renderSection = (key, titre, couleur) => {
    const grades = CONFIG[key] || [];
    return `<div class="card" style="margin-bottom:14px;">
      <div class="card-header" style="font-weight:800;border-left:4px solid ${couleur};">${titre} <span style="font-size:11px;color:var(--text-muted);font-weight:400;">(${grades.length})</span></div>
      <div class="card-body">
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;min-height:32px;">
          ${grades.length === 0
            ? '<span style="color:var(--text-muted);font-size:12px;font-style:italic;">Aucun grade</span>'
            : grades.map((g,i) => `<span style="display:inline-flex;align-items:center;gap:4px;background:var(--bg-main);border:1px solid var(--border-color);border-radius:5px;padding:4px 10px;font-size:12px;font-weight:700;">${g}<button style="border:none;background:none;color:#e53e3e;cursor:pointer;" onclick="supprimerGradeSection('${key}',${i})">✕</button></span>`).join('')}
        </div>
        <div style="display:flex;gap:8px;">
          <input type="text" id="new-grade-${key}" placeholder="Nouveau grade..." 
            style="flex:1;padding:7px 10px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-main);color:var(--text-color);font-size:13px;"
            onkeydown="if(event.key==='Enter')ajouterGradeSection('${key}')">
          <button class="btn btn-success btn-sm" onclick="ajouterGradeSection('${key}')">+ Ajouter</button>
        </div>
      </div>
    </div>`;
  };

  container.innerHTML = `<div style="max-width:780px;display:grid;grid-template-columns:1fr 1fr;gap:16px;">
    <div>${renderSection('grades_sp','Grades SP — Sapeurs-Pompiers','#e53e3e')}</div>
    <div>${renderSection('grades_sssm','Grades SSSM — Service de Santé','#38a169')}</div>
  </div>
  <div style="margin-top:8px;font-size:11px;color:var(--text-muted);">Ces grades apparaissent dans le sélecteur lors de la création des comptes utilisateurs.</div>`;
}

function ajouterGradeSection(key) {
  const val = (document.getElementById('new-grade-' + key)?.value||'').trim();
  if (!val) return;
  if (!CONFIG[key]) CONFIG[key] = [];
  CONFIG[key].push(val);
  // Synchroniser grades_custom
  CONFIG.grades_custom = [...(CONFIG.grades_sp||[]), ...(CONFIG.grades_sssm||[])];
  document.getElementById('new-grade-' + key).value = '';
  sauvegarderDonnees(); renderAdminGrades(); refreshGradeSelect();
}
function supprimerGradeSection(key, idx) {
  CONFIG[key].splice(idx, 1);
  CONFIG.grades_custom = [...(CONFIG.grades_sp||[]), ...(CONFIG.grades_sssm||[])];
  sauvegarderDonnees(); renderAdminGrades(); refreshGradeSelect();
}
function ajouterGrade() {
  const val = (document.getElementById('new-grade-input')?.value||'').trim();
  if (!val) return;
  if (!CONFIG.grades_custom) CONFIG.grades_custom = [];
  CONFIG.grades_custom.push(val);
  document.getElementById('new-grade-input').value = '';
  sauvegarderDonnees();
  renderAdminGrades();
  refreshGradeSelect();
}
function supprimerGrade(idx) {
  CONFIG.grades_custom.splice(idx, 1);
  sauvegarderDonnees();
  renderAdminGrades();
  refreshGradeSelect();
}
function refreshGradeSelect() {
  const sel = document.getElementById('mu-grade');
  if (!sel) return;
  // Initialiser les grades si vides
  if (!CONFIG.grades_custom || CONFIG.grades_custom.length === 0) {
    CONFIG.grades_custom = ['Sapeur','SA1 Cls','SA2 Cls','Caporal','Caporal-Chef','Sergent','Sergent-Chef','Adjudant','Adjudant-Chef','Major','BCH','MDC','Lieutenant','Capitaine','Commandant','Lieutenant-Colonel','Colonel','Médecin'];
    sauvegarderDonnees();
  }
  const cur = sel.value;
  sel.innerHTML = CONFIG.grades_custom.map(g=>`<option value="${g}" ${g===cur?'selected':''}>${g}</option>`).join('');
}
function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const prev = document.getElementById('mu-photo-display');
    if(prev) prev.src = ev.target.result;
    // Stocker en data URL pour sauvegarde
    if(document.getElementById('mu-photo-data')) document.getElementById('mu-photo-data').value = ev.target.result;
  };
  reader.readAsDataURL(file);
}
function deleteUserAdmin(idx) {
  if (USERS[idx].id === 'admin') return showToast("Impossible", "error");
  if (confirm("Supprimer ?")) { 
    const userIdToDelete = USERS[idx].id;
    USERS.splice(idx, 1); 
    localStorage.setItem('systel_users', JSON.stringify(USERS));
    
    // Supprimer de Firebase si disponible
    if (typeof fbDeleteUser === 'function' && _fbReady) {
      fbDeleteUser(userIdToDelete).then(() => console.log("Utilisateur supprimé de Firebase"));
    }

    sauvegarderDonnees();
    synchroniserTout(); 
    renderAdminUsers();
    showToast("Compte supprimé !");
  }
}
function sauvegarderUserAdmin() {
  try {
    const g = id => document.getElementById(id);
    const idInput = g('mu-id');
    const pwdInput = g('mu-pwd');
    
    if (!idInput || !pwdInput) {
      console.error("Éléments de formulaire mu-id ou mu-pwd manquants");
      return showToast("Erreur interne : Formulaire incomplet", "error");
    }

    const id = (idInput.value || '').trim();
    const pwd = (pwdInput.value || '').trim();

    if (!id) return showToast("L'identifiant est requis !", "error");
    if (!pwd) return showToast("Le mot de passe est requis !", "error");

    const selectedRoles = getSelectedRoles();
    if (selectedRoles.length === 0) return showToast("Sélectionnez au moins un rôle !", "error");

    const ln = (g('mu-lastname')?.value || '').trim();
    const fn = (g('mu-firstname')?.value || '').trim();
    const existingUser = currentEditIdx !== null ? USERS[currentEditIdx] : null;
    const photoData = g('mu-photo-data')?.value || existingUser?.photo || null;

    const u = {
      id,
      lastname: ln,
      firstname: fn,
      name: (ln + ' ' + fn).trim() || id,
      pwd,
      roles: selectedRoles,
      role: selectedRoles[0],
      grade: g('mu-grade')?.value || existingUser?.grade || 'Sapeur',
      tel: existingUser?.tel || '',
      email: existingUser?.email || '',
      photo: photoData
    };

    console.log("Sauvegarde de l'utilisateur :", u);

    if (currentEditIdx !== null) {
      USERS[currentEditIdx] = u;
    } else {
      // Vérifier si l'ID existe déjà pour un nouvel utilisateur
      if (USERS.some(user => user.id === id)) {
        return showToast("Cet identifiant est déjà utilisé !", "error");
      }
      USERS.push(u);
    }

    // Sauvegarder immédiatement dans localStorage sous les deux clés pour compatibilité
    localStorage.setItem('systel_users', JSON.stringify(USERS));
    localStorage.setItem('systel_users_list', JSON.stringify(USERS)); // Clé de secours
    
    // Sauvegarder dans Firebase si disponible
    if (typeof fbSaveUser === 'function' && _fbReady) {
      fbSaveUser(u).then(() => console.log("Utilisateur synchronisé avec Firebase"));
    }

    sauvegarderDonnees();
    synchroniserTout();
    fermerModal();
    renderAdminUsers();
    
    showToast("Compte " + (currentEditIdx !== null ? "modifié" : "créé") + " !");
    console.log("Utilisateur sauvegardé avec succès. Total USERS:", USERS.length);
  } catch (err) {
    console.error("Erreur lors de la sauvegarde de l'utilisateur :", err);
    showToast("Une erreur est survenue lors de la sauvegarde", "error");
  }
}


function renderAnnuaire() {
  const grid = document.getElementById('annuaire-grid');
  if (!grid) return;
  grid.innerHTML = ANNUAIRE.map(c => `
    <div class="card annuaire-card"><div class="card-body">
      <div style="display:flex;align-items:center;gap:15px;margin-bottom:10px;">
        <div class="avatar-md"><img src="${c.photo || 'https://www.w3schools.com/howto/img_avatar.png'}"></div>
        <div><div style="font-weight:700;color:var(--primary);font-size:14px;">${c.nom}</div><div style="font-size:11px;color:var(--text-muted);font-weight:600;">${c.grade}</div></div>
      </div>
      <div style="font-size:12px;">📞 <strong>${c.tel}</strong><br>✉️ ${c.email}</div>
      ${userIsAdmin(currentUser) ? `<button class="btn btn-secondary btn-sm" style="width:100%;margin-top:10px;" onclick="showSection('admin');showAdminTab('users');">MODIFIER</button>` : ''}
    </div></div>
  `).join('');
}

// ===== PERSISTANCE =====
function chargerDonnees() {
  const d = key => localStorage.getItem('systel_' + key);
  if (d('config')) CONFIG = JSON.parse(d('config'));
  if (d('intranet')) INTRANET_CONFIG = JSON.parse(d('intranet'));
  if (d('casernes')) CASERNES = JSON.parse(d('casernes'));
  const enginsRaw = d('engins');
  if (enginsRaw !== null) { try { ENGINS = JSON.parse(enginsRaw); } catch(e) { ENGINS = []; } }
  // Ne pas utiliser les defaults si localStorage a une liste (même vide)
  if (d('users')) USERS = JSON.parse(d('users'));
  if (d('planning')) PLANNING = JSON.parse(d('planning'));
  if (d('interventions')) INTERVENTIONS = JSON.parse(d('interventions'));
  if (d('feuilles_garde')) FEUILLES_GARDE = JSON.parse(d('feuilles_garde'));
  if (d('carte_blips')) CARTE_BLIPS = JSON.parse(d('carte_blips'));
  if (d('cossim_config')) COSSIM_CONFIG = JSON.parse(d('cossim_config'));
}
function sauvegarderDonnees() {
  const s = (k, v) => localStorage.setItem('systel_' + k, JSON.stringify(v));
  localStorage.setItem('systel_save_ts', Date.now().toString());
  // Toujours synchroniser users pour la garde COSSIM
  localStorage.setItem('systel_users', JSON.stringify(USERS));
  s('config',CONFIG); s('intranet',INTRANET_CONFIG); s('casernes',CASERNES); s('engins',ENGINS);
  s('users',USERS); s('planning',PLANNING); s('interventions',INTERVENTIONS);
  s('feuilles_garde',FEUILLES_GARDE); s('carte_blips',CARTE_BLIPS); s('cossim_config',COSSIM_CONFIG);
}
function startClock() { setInterval(() => { const c = document.getElementById('current-clock'); if (c) c.textContent = new Date().toLocaleTimeString('fr-FR'); }, 1000); }
function initDate() { const el = document.getElementById('center-title'); if (el) el.textContent = `CENTRE ${CONFIG.centre} - ${new Date().toLocaleDateString('fr-FR')} (WEB1)`; }
function showToast(msg, type='') { const t = document.getElementById('toast'); if (t) { t.textContent = msg; t.className = 'toast show '+type; setTimeout(() => t.className='toast', 3000); } }
function ouvrirModal(id) {
  if (id === 'modal-ber') {
    document.getElementById('modal-ber').style.display = 'flex';
    return;
  }
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById(id).classList.add('open');
}
function fermerModal() {
  // Fermer BER (div fixe)
  const berModal = document.getElementById('modal-ber');
  if (berModal) berModal.style.display = 'none';
  // Fermer modaux classiques
  document.getElementById('modal-overlay').classList.remove('open');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
}
function resetSystem() { if (confirm("⚠️ RÉINITIALISER TOUT ?")) { localStorage.clear(); location.reload(); } }

function renderAdminCasernes() {
  const tbody = document.getElementById('adm-casernes-list');
  tbody.innerHTML = CASERNES.map((c,cIdx) => `
    <tr style="background:#edf2f7;font-weight:800;"><td colspan="2">${c.nom}</td></tr>
    ${c.sections.map((s,sIdx) => `
      <tr><td style="padding-left:30px;">${s.nom}</td><td>
        <button class="btn btn-danger btn-sm" onclick="CASERNES[${cIdx}].sections.splice(${sIdx},1);sauvegarderDonnees();renderAdminCasernes();">✕</button>
      </td></tr>`).join('')}
    <tr><td colspan="2"><button class="btn btn-secondary btn-sm" onclick="ajouterSection(${cIdx})">+ Ajouter Section</button></td></tr>
  `).join('');
}
function renderAdminEngins() {
  const tbody = document.getElementById('adm-engins-list');
  const allS = []; CASERNES.forEach(c => c.sections.forEach(s => allS.push({id:s.id,nom:`${c.nom} > ${s.nom}`})));
  const bySec = {};
  CASERNES.forEach(c => c.sections.forEach(s => { bySec[s.id] = { caserne: c.nom, section: s.nom, engins: [] }; }));
  ENGINS.forEach((e,idx) => { if (bySec[e.section]) bySec[e.section].engins.push({e,idx}); });

  let html = '';
  Object.entries(bySec).forEach(([secId, data]) => {
    html += `<tr style="background:#1a202c;color:white;"><td colspan="4" style="padding:8px 12px;font-weight:800;font-size:12px;">${data.caserne} › ${data.section}</td></tr>`;
    if (data.engins.length === 0) {
      html += `<tr><td colspan="4" style="padding:6px 20px;color:#718096;font-size:12px;font-style:italic;">Aucun engin</td></tr>`;
    }
    data.engins.forEach(({e,idx}) => {
      const statCls = e.statut === 'disponible' ? '#38a169' : e.statut === 'intervention' ? '#f97316' : '#718096';
      const postes = (e.postes || [{id:'ca',label:"Chef d'agrès",abrev:'C/A'}]);
      const postesHTML = postes.map((p,pi) => `
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="font-size:11px;color:#a0aec0;min-width:20px;">${pi+1}.</span>
          <input type="text" value="${p.abrev}" placeholder="Abrev" style="width:60px;font-size:11px;padding:3px 6px;"
            onchange="ENGINS[${idx}].postes[${pi}].abrev=this.value;sauvegarderDonnees();">
          <input type="text" value="${p.label}" placeholder="Label complet" style="flex:1;font-size:11px;padding:3px 6px;"
            onchange="ENGINS[${idx}].postes[${pi}].label=this.value;sauvegarderDonnees();">
          ${pi > 0 ? `<button class="btn btn-danger btn-sm" style="padding:2px 6px;font-size:10px;" onclick="supprimerPoste(${idx},${pi})">✕</button>` : '<span style="font-size:10px;color:#f97316;font-weight:800;">C/A</span>'}
        </div>`).join('');
      html += `<tr>
        <td style="padding-left:20px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="width:10px;height:10px;border-radius:50%;background:${statCls};flex-shrink:0;display:inline-block;"></span>
            <input type="text" value="${e.nom}" onchange="ENGINS[${idx}].nom=this.value;sauvegarderDonnees();" style="width:120px;">
          </div>
        </td>
        <td>
          <select onchange="ENGINS[${idx}].section=this.value;sauvegarderDonnees();renderAdminEngins();">
            ${allS.map(s => `<option value="${s.id}" ${e.section===s.id?'selected':''}>${s.nom}</option>`).join('')}
          </select>
        </td>
        <td style="min-width:260px;">
          <div style="font-size:11px;color:#e53e3e;font-weight:700;margin-bottom:4px;">Postes (1er = toujours C/A)</div>
          ${postesHTML}
          <button class="btn btn-success btn-sm" style="margin-top:4px;font-size:10px;padding:3px 8px;" onclick="ajouterPoste(${idx})">+ Poste</button>
        </td>
        <td style="min-width:200px;">
          <div style="font-size:10px;color:#718096;margin-bottom:4px;font-weight:700;">GFO autorisés</div>
          <div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:4px;">
            ${(e.gfoPresets||[]).map((g,gi) => `<span style="background:var(--bg-main);border:1px solid var(--border-color);border-radius:4px;padding:2px 6px;font-size:11px;font-weight:700;display:flex;align-items:center;gap:3px;">${g}<button style="border:none;background:none;color:#e53e3e;cursor:pointer;font-size:10px;" onclick="supprimerGFOEngin(${idx},${gi})">✕</button></span>`).join('')}
          </div>
          <div style="display:flex;gap:4px;">
            <select id="gfo-preset-sel-${idx}" style="font-size:11px;padding:2px 4px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-main);color:var(--text-color);">
              <option value="">-- GFO --</option>
              ${(COSSIM_CONFIG.gfo_types||['G-SAP','G-SSO','PROMPT_SAP','G-INC']).map(g=>`<option value="${g}">${g}</option>`).join('')}
            </select>
            <button class="btn btn-success btn-sm" style="font-size:10px;padding:2px 6px;" onclick="ajouterGFOEngin(${idx})">+</button>
          </div>
        </td>
        <td><button class="btn btn-danger btn-sm" onclick="supprimerEnginAdmin(${idx});">✕</button></td>
      </tr>`;
    });
  });
  tbody.innerHTML = html;
  // Mettre à jour le thead
  const thead = tbody.closest('table').querySelector('thead tr');
  if (thead) thead.innerHTML = '<th>Nom</th><th>Section</th><th>Postes</th><th>GFO Défaut</th><th>Actions</th>';
}
function supprimerEnginAdmin(idx) {
  if (!confirm("Supprimer cet engin ?")) return;
  ENGINS.splice(idx, 1);
  // Forcer la sauvegarde ET mettre à jour save_ts
  localStorage.setItem('systel_engins', JSON.stringify(ENGINS));
  localStorage.setItem('systel_save_ts', Date.now().toString());
  sauvegarderDonnees();
  renderAdminEngins();
  updateSynoptique();
  showToast("Engin supprimé !");
}
function ajouterGFOEngin(idx) {
  const sel = document.getElementById('gfo-preset-sel-' + idx);
  if (!sel || !sel.value) return;
  if (!ENGINS[idx].gfoPresets) ENGINS[idx].gfoPresets = [];
  if (!ENGINS[idx].gfoPresets.includes(sel.value)) {
    ENGINS[idx].gfoPresets.push(sel.value);
    sauvegarderDonnees();
    renderAdminEngins();
  }
}
function supprimerGFOEngin(enginIdx, gfoIdx) {
  ENGINS[enginIdx].gfoPresets.splice(gfoIdx, 1);
  sauvegarderDonnees();
  renderAdminEngins();
}
function ajouterPoste(idx) {
  if (!ENGINS[idx].postes) ENGINS[idx].postes = [{id:'ca',label:"Chef d'agrès",abrev:'C/A'}];
  const n = ENGINS[idx].postes.length + 1;
  ENGINS[idx].postes.push({id:'p'+n, label:'Équipier '+n, abrev:'EQ'+n});
  sauvegarderDonnees(); renderAdminEngins();
}
function supprimerPoste(enginIdx, posteIdx) {
  if (posteIdx === 0) return showToast("Le C/A ne peut pas être supprimé !","error");
  ENGINS[enginIdx].postes.splice(posteIdx, 1);
  sauvegarderDonnees(); renderAdminEngins();
}
function ajouterEnginAdmin() {
  if (!CASERNES[0]||CASERNES[0].sections.length===0) return showToast("Créez une section !","error");
  ENGINS.push({id:"E"+Date.now(),nom:"NOUVEAU",section:CASERNES[0].sections[0].id,statut:"disponible",berStatut:null,chefAgres:null,
    postes:[{id:'ca',label:"Chef d'agrès",abrev:'C/A'},{id:'eq1',label:'Équipier 1',abrev:'EQ1'},{id:'eq2',label:'Équipier 2',abrev:'EQ2'}]
  });
  renderAdminEngins(); sauvegarderDonnees();
}
function sauvegarderToutAdmin() {
  CONFIG.nom = document.getElementById('adm-centre-nom').value;
  CONFIG.centre = document.getElementById('adm-centre-code').value;
  sauvegarderDonnees(); initDate(); showToast("Enregistré !");
}
function ajouterSection(cIdx) {
  const nom = prompt("Nom Section :");
  if (nom) { CASERNES[cIdx].sections.push({id:nom.toUpperCase().replace(/\s+/g,'-'),nom}); sauvegarderDonnees(); renderAdminCasernes(); }
}

// ===== BIP ALERTES =====
let bipAlerteVisible = false;
let bipAudio = null;

function checkBipAlertes() {
  if (!currentUser || bipAlerteVisible) return;
  const bipData = localStorage.getItem('systel_bip_' + currentUser.id);
  if (bipData) {
    const bip = JSON.parse(bipData);
    if (!bip.acquitte) {
      bipAlerteVisible = true;
      afficherBipAlerte(bip);
      // BIP uniquement sur index.html — pas de broadcast pour éviter latence
    }
  }
}

function afficherBipAlerte(bip) {
  const overlay = document.getElementById('bip-overlay');
  if (!overlay) return;
  const el = (id) => document.getElementById(id);
  // Cadre vert uniquement
  const motif = (bip.motif || 'INTERVENTION').toUpperCase();
  if(el('bip-screen-motif')) el('bip-screen-motif').textContent = motif;
  if(el('bip-screen-engin')) el('bip-screen-engin').textContent = bip.enginNom || '';
  // Poste sans le préfixe "Place:"
  if(el('bip-screen-place')) el('bip-screen-place').textContent = (bip.place||'').replace(/^Place:\s*/i,'');
  if(el('bip-screen-num')) el('bip-screen-num').textContent = bip.interNum || '';
  overlay.style.display = 'flex';
  if (typeof playBip === 'function') { playBip(true); }
}

function acquitterBip() {
  // Arrêter le son bip + jouer acquittement
  if (typeof stopBip === 'function') stopBip(); else if (bipAudio) { bipAudio.pause(); bipAudio.currentTime=0; bipAudio=null; }
  if (typeof playAck === 'function') playAck(); else { try { new Audio('sounds/acquittement.mp3').play().catch(()=>{}); } catch(e){} }
  // Marquer acquitté
  const bipData = localStorage.getItem('systel_bip_' + currentUser.id);
  if (bipData) {
    const bip = JSON.parse(bipData);
    bip.acquitte = true;
    localStorage.setItem('systel_bip_' + currentUser.id, JSON.stringify(bip));
    // Ouvrir ticket départ si chef d'agrès — UNE SEULE fois
    if (bip.isChefAgres && !bip.ticketOuvert) {
      bip.ticketOuvert = true;
      localStorage.setItem('systel_bip_' + currentUser.id, JSON.stringify(bip));
      const params = new URLSearchParams({
        inter: bip.interventionId || bip.interNum || '',
        engin: bip.enginId || '',
        motif: bip.motif || '',
        adresse: bip.adresse || '',
        date: new Date().toISOString()
      });
      window.open('ticket_depart.html?' + params.toString(), '_blank');
    }
    // Ouvrir BER si défini
    if (bip.enginId) {
      setTimeout(() => ouvrirBER(bip.enginId), 1200);
    }
  }
  document.getElementById('bip-overlay').style.display = 'none';
  bipAlerteVisible = false;
}

// ===== HISTORIQUE DES INTERVENTIONS =====
function renderHistorique() {
  const container = document.getElementById('historique-container');
  if (!container) return;
  chargerDonnees();

  // Toutes les interventions triées par date desc
  const all = [...INTERVENTIONS].sort((a,b) => new Date(b.date) - new Date(a.date));

  if (all.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:60px;color:var(--text-muted);font-size:14px;">📜 Aucune intervention dans l\'historique</div>';
    return;
  }

  // Filtre texte
  const filterVal = document.getElementById('histo-filter')?.value?.toLowerCase() || '';

  const filtered = all.filter(i =>
    !filterVal ||
    (i.type||'').toLowerCase().includes(filterVal) ||
    (i.adresse||'').toLowerCase().includes(filterVal) ||
    (i.numero||'').toLowerCase().includes(filterVal) ||
    (i.commune||'').toLowerCase().includes(filterVal)
  );

  container.innerHTML = filtered.map(inter => {
    const d = inter.date ? new Date(inter.date) : new Date();
    const dateStr = d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
    const statut = inter.statut === 'Terminée' ? '🔴 Terminée' : '🟢 En cours';
    const statutColor = inter.statut === 'Terminée' ? '#e53e3e' : '#38a169';

    // Construire le journal de l'inter
    const events = [];

    // 1. Engagement initial
    const engageurNom = inter.creePar || 'COSSIM';
    let engagementContent = `ENGAGEMENT ${(inter.engins||[]).map(eId => ENGINS.find(e=>e.id===eId)?.nom||eId).join(', ')}\n\n`;
    (inter.engins||[]).forEach(eId => {
      const eq = inter.equipes?.[eId];
      const gfo = inter.enginsGFO?.[eId] || '';
      const engin = ENGINS.find(e=>e.id===eId);
      (eq?.membres||[]).forEach(m => {
        const u = USERS.find(x=>x.id===m.userId);
        if (u) engagementContent += `${m.abrev} ${gfo} - ${u.lastname?.toUpperCase()} ${u.firstname}\n`;
      });
    });
    events.push({ date: d, auteur: engageurNom, contenu: engagementContent.trim() });

    // 2. Statuts BER (si logs disponibles)
    (inter.berLogs||[]).forEach(log => {
      const ber = BER_STATUTS?.find(b=>b.code===log.code);
      events.push({
        date: new Date(log.date),
        auteur: `Terminal ANTARES BER`,
        contenu: `${(ENGINS.find(e=>e.id===log.enginId)?.nom||log.enginId)} - ${ber?.label||log.code}`
      });
    });

    // 3. Renfort
    (inter.autresMoyensAlertes||[]).forEach(m => {
      events.push({
        date: new Date(m.date||inter.date),
        auteur: 'COSSIM',
        contenu: `RENFORT ${m.enginNom||m.enginId} — GFO: ${m.gfo||'--'}`
      });
    });

    // 4. Terminaison
    if (inter.dateFin) {
      events.push({
        date: new Date(inter.dateFin),
        auteur: 'COSSIM',
        contenu: 'Intervention terminée'
      });
    }

    events.sort((a,b) => a.date - b.date);

    const eventsRows = events.map(ev => {
      const evDate = ev.date.toLocaleDateString('fr-FR') + ' à ' + ev.date.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
      const lines = ev.contenu.split('\n').filter(Boolean);
      return `<tr>
        <td style="vertical-align:top;white-space:nowrap;padding:8px 12px;font-size:12px;color:var(--text-muted);border-bottom:1px solid var(--border-color);min-width:160px;">
          <div>${evDate}</div>
          <div style="font-size:11px;font-weight:700;color:var(--accent);margin-top:2px;">${ev.auteur}</div>
        </td>
        <td style="padding:8px 12px;font-size:13px;border-bottom:1px solid var(--border-color);white-space:pre-line;">${lines.join('\n')}</td>
      </tr>`;
    }).join('');

    return `<div style="margin-bottom:20px;background:var(--card-bg);border-radius:10px;border:1px solid var(--border-color);overflow:hidden;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 18px;background:var(--bg-main);border-bottom:2px solid var(--border-color);cursor:pointer;" onclick="toggleHisto('h-${inter.id}')">
        <div style="display:flex;align-items:center;gap:16px;">
          <span style="font-size:14px;font-weight:900;color:var(--accent);">${inter.numero||inter.id}</span>
          <span style="font-size:13px;font-weight:800;">${inter.type||'INTERVENTION'}</span>
          <span style="font-size:12px;color:var(--text-muted);">📍 ${inter.adresse||'--'}</span>
        </div>
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:12px;color:var(--text-muted);">${dateStr}</span>
          <span style="font-size:11px;font-weight:800;color:${statutColor};background:${statutColor}22;padding:2px 10px;border-radius:10px;">${statut}</span>
        </div>
      </div>
      <div id="h-${inter.id}" style="display:none;">
        <div style="padding:10px 18px;background:var(--bg-main);border-bottom:1px solid var(--border-color);display:flex;gap:16px;font-size:12px;color:var(--text-muted);">
          <span>🏘️ <strong>${inter.commune||'--'}</strong></span>
          <span>📞 ${inter.nca||'--'}</span>
          <span>👤 ${inter.contact||'--'}</span>
          ${inter.observations ? `<span>📝 ${inter.observations.substring(0,60)}${inter.observations.length>60?'...':''}</span>` : ''}
        </div>
        <table style="width:100%;border-collapse:collapse;">
          <thead><tr>
            <th style="padding:6px 12px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;border-bottom:2px solid var(--border-color);">Horodatage</th>
            <th style="padding:6px 12px;text-align:left;font-size:11px;font-weight:700;color:var(--text-muted);text-transform:uppercase;border-bottom:2px solid var(--border-color);">Contenu</th>
          </tr></thead>
          <tbody>${eventsRows}</tbody>
        </table>
        <div style="padding:10px 18px;border-top:1px solid var(--border-color);display:flex;gap:8px;">
          ${userHasCOSSIM(currentUser) ? `<button class="btn btn-secondary btn-sm" onclick="window.open('ticket_depart.html?inter=${inter.id}&engin=${(inter.engins||[])[0]||''}','_blank')">\u{1F5A8}\uFE0F Ticket</button>` : ''}
          ${userIsAdmin(currentUser) ? `<button class="btn btn-danger btn-sm" onclick="supprimerInterHistorique('${inter.id}')">\u{1F5D1}\uFE0F Supprimer</button>` : ''}
        </div>
      </div>
    </div>`;
  }).join('');
}

function toggleHisto(id) {
  const el = document.getElementById(id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// Ajouter un log BER à une intervention
function logBERAction(enginId, code, label) {
  const inter = INTERVENTIONS.find(i => i.statut === 'En cours' && (i.engins||[]).includes(enginId));
  if (!inter) return;
  if (!inter.berLogs) inter.berLogs = [];
  inter.berLogs.push({ enginId, code, label, date: new Date().toISOString() });
  sauvegarderDonnees();
}


// ===== WEBHOOKS DISCORD =====
function saveWebhookConfig() {
  if (!CONFIG.webhooks) CONFIG.webhooks = {};
  CONFIG.webhooks.ticket = document.getElementById('wh-ticket')?.value || '';
  CONFIG.webhooks.intervention = document.getElementById('wh-intervention')?.value || '';
  CONFIG.webhooks.synoptique = document.getElementById('wh-synoptique')?.value || '';
  sauvegarderDonnees();
  showToast('Webhooks sauvegardés !');
}

async function sendDiscordWebhook(url, embed) {
  if (!url) return;
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] })
    });
  } catch(e) { console.warn('Discord webhook error:', e); }
}

async function webhookNouvelleIntervention(inter, equipes, enginsGFO) {
  const url = CONFIG?.webhooks?.intervention;
  if (!url) return;
  const centre = CONFIG?.centreAbrev || CONFIG?.centre || 'PTR';
  const interDate = inter.date ? new Date(inter.date) : new Date();
  const dateStr = interDate.toLocaleDateString('fr-FR') + ' ' + interDate.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});

  const enginsList = (inter.engins||[]).map(eId => {
    const e = ENGINS.find(x=>x.id===eId);
    const gfo = enginsGFO?.[eId] || '--';
    const mbrs = equipes?.[eId]?.membres || [];
    const equipe = mbrs.map(m => {
      const u = USERS.find(x=>x.id===m.userId);
      return u ? `  \`${(m.abrev||'').padEnd(6)}\` ${(u.grade||'').padEnd(10)} **${(u.lastname||'').toUpperCase()} ${u.firstname||''}**` : `  \`${m.abrev||'--'}\``;
    }).join('\n');
    return `**${e?.nom||eId}** — GFO: \`${gfo}\`\n${equipe||'  *Non armé*'}`;
  }).join('\n\n') || '*Aucun engin*';

  const consigne = COSSIM_CONFIG?.erp_consignes?.[inter.etablissement] || '';
  const embed = {
    title: `🚨 ENGAGEMENT — ${(inter.type||'INTERVENTION').toUpperCase()}`,
    color: 0xe53e3e,
    fields: [
      { name: '🔢 N° Intervention', value: `\`${inter.numero||inter.id}\``, inline: true },
      { name: '⏰ Heure', value: dateStr, inline: true },
      { name: '🏛️ Centre', value: centre, inline: true },
      { name: '📍 Localisation', value: [
        inter.commune ? `**Commune:** ${inter.commune}` : null,
        inter.voie ? `**Voie:** ${inter.voie}` : null,
        inter.precision ? `**Précision:** ${inter.precision}` : null,
        inter.etablissement ? `**ETARE:** ${inter.etablissement}` : null,
        consigne ? `**Consigne:** ${consigne}` : null,
        inter.contact ? `**Contact:** ${inter.contact}` : null,
        inter.nca ? `**N° contre-appel:** ${inter.nca}` : null,
      ].filter(Boolean).join('\n') || '--', inline: false },
      { name: '🚒 Engins engagés', value: enginsList, inline: false },
      { name: '👥 Services concernés', value: (inter.services||[]).join(', ')||'-', inline: false },
      { name: '📝 Observations', value: inter.observations||'-', inline: false },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: `SYSTEL — ${centre}` }
  };
  await sendDiscordWebhook(url, embed);
}

async function webhookTicketDepart(inter, enginId) {
  const url = CONFIG?.webhooks?.ticket;
  if (!url) return;
  const engin = ENGINS.find(e=>e.id===enginId);
  const eq = inter.equipes?.[enginId];
  const gfo = inter.enginsGFO?.[enginId] || '--';
  const centre = CONFIG?.centreAbrev || CONFIG?.centre || 'PTR';
  const interDate = inter.date ? new Date(inter.date) : new Date();
  const dateStr = interDate.toLocaleDateString('fr-FR') + ' ' + interDate.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});

  // Armement — style ticket officiel
  const armRows = (eq?.membres||[]).map(m => {
    const u = USERS.find(x=>x.id===m.userId);
    return u ? `\`${(m.abrev||'--').padEnd(8)}\` \`${(u.grade||'--').padEnd(12)}\` **${(u.lastname||'').toUpperCase()} ${u.firstname||''}**` : `\`${m.abrev||'--'}\``;
  }).join('\n') || '*Équipage non renseigné*';

  // Autres moyens alertés
  const autresMoyens = (inter.autresMoyensAlertes||[]).map(m =>
    `${getCentreNom(ENGINS.find(e=>e.id===m.enginId)?.section)} — ${m.gfo||'--'} — **${m.enginNom||m.enginId}**`
  ).join('\n') || '*Aucun*';

  // Moyens déjà engagés
  const moyensEngages = (inter.engins||[]).filter(id=>id!==enginId).map(id => {
    const e = ENGINS.find(x=>x.id===id);
    return `${getCentreNom(e?.section)} — **${e?.nom||id}** — ${dateStr}`;
  }).join('\n') || '*Aucun*';

  const consigne = COSSIM_CONFIG?.erp_consignes?.[inter.etablissement] || 'ERP fermé.';

  const embed = {
    title: `🚒 TICKET DE DÉPART — ${engin?.nom||enginId}`,
    color: 0x1a202c,
    description: `**${inter.type||'INTERVENTION'}**`,
    fields: [
      { name: '📋 DÉPART', value: `\`${inter.renfortDe ? 'RENFORT' : 'DÉPART STANDARD'}\``, inline: true },
      { name: '🏛️ CENTRE', value: `\`${centre}\``, inline: true },
      { name: '🔢 N° INTERVENTION', value: `\`${inter.numero||inter.id}\``, inline: true },
      { name: '⏰ Date/Heure', value: dateStr, inline: true },
      { name: '🚒 Engin', value: `**${engin?.nom||enginId}**`, inline: true },
      { name: '📡 GFO', value: `\`${gfo}\``, inline: true },
      { name: '📍 LOCALISATION', value: [
        inter.commune ? `**Commune:** ${inter.commune}` : null,
        inter.voie ? `**Voie:** ${inter.voie}` : null,
        inter.numero ? `**N°:** ${inter.numero}` : null,
        inter.precision ? `**Précision:** ${inter.precision}` : null,
        inter.etablissement ? `**ETARE:** ${inter.etablissement}` : null,
        `**Consigne:** ${consigne}`,
        inter.contact ? `**Contact:** ${inter.contact}` : null,
        inter.nca ? `**Contre-appel:** ${inter.nca}` : null,
      ].filter(Boolean).join('\n') || '--', inline: false },
      { name: '📝 OBSERVATIONS', value: inter.observations || '-', inline: false },
      { name: '👥 ARMEMENT DES VÉHICULES', value: armRows || '*Non renseigné*', inline: false },
      { name: '🚨 AUTRES MOYENS ALERTÉS', value: autresMoyens, inline: true },
      { name: '✅ MOYENS DÉJÀ ENGAGÉS', value: moyensEngages, inline: true },
    ],
    timestamp: new Date().toISOString(),
    footer: { text: `SYSTEL — ${centre} — ${CONFIG?.typeGarde||''}` }
  };
  await sendDiscordWebhook(url, embed);
}

function getCentreNom(sectionId) {
  if (!sectionId) return CONFIG?.centre||'--';
  for (const cas of CASERNES) {
    for (const s of cas.sections) {
      if (s.id === sectionId) return cas.nom;
    }
  }
  return CONFIG?.centre||'--';
}

async function webhookSynoptique() {
  const url = CONFIG?.webhooks?.synoptique;
  if (!url) return;
  const enCours = INTERVENTIONS.filter(i=>i.statut==='En cours');
  const centre = CONFIG?.centreAbrev || CONFIG?.centre || 'PTR';
  const now = new Date();
  const heureStr = now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});

  if (enCours.length === 0) {
    const embed = {
      title: `📊 SYNOPTIQUE — ${centre}`,
      description: '✅ **Aucune intervention en cours**',
      color: 0x38a169,
      timestamp: now.toISOString(),
      footer: { text: `SYSTEL — ${centre} — Mis à jour à ${heureStr}` }
    };
    await sendDiscordWebhook(url, embed);
    return;
  }

  const fields = enCours.map(i => {
    const engins = (i.engins||[]).map(eId => {
      const e = ENGINS.find(x=>x.id===eId);
      const ber = e?.berStatut ? BER_STATUTS?.find(b=>b.code===e.berStatut) : null;
      const gfo = i.enginsGFO?.[eId] || '';
      const eq = i.equipes?.[eId];
      const ca = eq?.membres?.[0];
      const caUser = ca ? USERS.find(u=>u.id===ca.userId) : null;
      return `  🚒 **${e?.nom||eId}** ${gfo?`\`${gfo}\``:''}${ber?` → ${ber.label}`:''}${caUser?` — C/A: ${caUser.lastname} ${caUser.firstname}`:''}`;
    }).join('\n');
    const d = i.date ? new Date(i.date) : now;
    const dStr = d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
    return {
      name: `🚨 #${i.numero||i.id} — ${i.type||'?'} (${dStr})`,
      value: `📍 ${i.adresse||'--'}\n${engins||'*Aucun engin*'}`,
      inline: false
    };
  });

  const embed = {
    title: `📊 SYNOPTIQUE EN DIRECT — ${centre}`,
    description: `**${enCours.length} intervention(s) en cours** — Mis à jour à ${heureStr}`,
    color: 0xf97316,
    fields,
    timestamp: now.toISOString(),
    footer: { text: `SYSTEL — ${centre}` }
  };
  await sendDiscordWebhook(url, embed);
}

// Synoptique Discord — un seul message édité (PATCH)
let _synopDiscordTimer = null;
let _synopDiscordMsgId = null; // ID du message Discord pour l'éditer

async function webhookSynoptiqueEdit() {
  const url = CONFIG?.webhooks?.synoptique;
  if (!url) return;
  chargerDonnees();
  const enCours = INTERVENTIONS.filter(i=>i.statut==='En cours');
  const centre = CONFIG?.centreAbrev || CONFIG?.centre || 'PTR';
  const now = new Date();
  const heureStr = now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  const fields = enCours.length === 0
    ? [{ name:'✅ Aucune intervention', value:'Tout est calme.', inline:false }]
    : enCours.map(i => {
        const engins = (i.engins||[]).map(eId=>{
          const e=ENGINS.find(x=>x.id===eId);
          const ber=e?.berStatut?BER_STATUTS?.find(b=>b.code===e.berStatut):null;
          return `🚒 **${e?.nom||eId}**${ber?` → ${ber.label}`:''}`;
        }).join(', ');
        return { name:`🚨 #${i.numero||i.id} — ${i.type||'?'}`, value:`📍 ${i.adresse||'--'}
${engins||'Aucun engin'}`, inline:false };
      });
  const embed = {
    title:`📊 SYNOPTIQUE — ${centre}`,
    description:`**${enCours.length} intervention(s) en cours** — ${heureStr}`,
    color: enCours.length===0 ? 0x38a169 : 0xf97316,
    fields,
    timestamp: now.toISOString(),
    footer:{ text:`SYSTEL — ${centre}` }
  };
  try {
    if (_synopDiscordMsgId) {
      // PATCH — modifier le message existant
      const patchUrl = url.replace('/webhooks/', '/webhooks/').replace(/\/[^\/]+$/, m => m) + '/messages/' + _synopDiscordMsgId;
      // Discord ne supporte pas PATCH via webhook directement, on utilise le ?wait=true trick
      // On supprime et recrée (via ?wait=true pour avoir l'ID)
    }
    // POST avec ?wait=true pour récupérer l'ID du message
    const resp = await fetch(url + '?wait=true', {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({ embeds:[embed] })
    });
    if (resp.ok) {
      const data = await resp.json();
      _synopDiscordMsgId = data.id;
    }
  } catch(e) { console.warn('Synoptique webhook err:', e); }
}

// Surcharger webhookSynoptique pour utiliser l'édition
async function webhookSynoptique() {
  await webhookSynoptiqueEdit();
}

function startSynopDiscordTimer() {
  if (_synopDiscordTimer) clearInterval(_synopDiscordTimer);
  if (CONFIG?.webhooks?.synoptique) {
    _synopDiscordTimer = setInterval(webhookSynoptiqueEdit, 5 * 60 * 1000);
    webhookSynoptiqueEdit();
  }
}

function testWebhookIntervention() {
  const fakeInter = {
    id: 'TEST-001', numero: 'TEST-001', type: 'TEST WEBHOOK', commune: 'Marseille',
    adresse: '1 Rue Test', observations: 'Ceci est un test webhook', engins: [], equipes: {}, enginsGFO: {}
  };
  webhookNouvelleIntervention(fakeInter, {}, {});
  showToast('Test webhook envoyé !');
}

function supprimerInterHistorique(interId) {
  if (!confirm('Supprimer définitivement cette intervention de l\'historique ?')) return;
  const idx = INTERVENTIONS.findIndex(i => i.id === interId);
  if (idx !== -1) {
    INTERVENTIONS.splice(idx, 1);
    sauvegarderDonnees();
    renderHistorique();
    showToast('Intervention supprimée de l\'historique');
  }
}
