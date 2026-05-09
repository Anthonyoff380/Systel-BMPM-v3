/* ============================================================
   SYSTEL POMPIERS - APP JS (PTR VERSION v17 - EXTENDED)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();
  synchroniserTout();
  checkAuth();
  startClock();
  // Polling localStorage pour simuler le temps réel (multi-onglets)
  setInterval(() => {
    chargerDonnees();
    const section = document.querySelector('.section.active-section');
    if (section) {
      const id = section.id.replace('section-', '');
      if (id === 'synoptique') updateSynoptique();
      if (id === 'interventions') renderInterventionsSynoptique();
      if (id === 'planning') renderPlanning();
    }
    checkBipAlertes();
  }, 2000);
});

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
  const id = document.getElementById('login-id').value;
  const pwd = document.getElementById('login-pwd').value;
  const user = USERS.find(u => u.id === id && u.pwd === pwd);
  if (user) {
    currentUser = user;
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
  badge.className = 'badge ' + (userIsAdmin(currentUser) ? 'badge-danger' : userIsSOG(currentUser) ? 'badge-warning' : 'badge-info');

  document.getElementById('nav-admin').style.display = userIsAdmin(currentUser) ? 'flex' : 'none';

  initDate();
  showSection('synoptique');
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
  const btn = evt ? evt.target : document.querySelector(`.admin-tab-btn[data-tab="${tabName}"]`);
  if (btn) btn.classList.add('active');
  if (tabName === 'users') renderAdminUsers();
  if (tabName === 'engins') renderAdminEngins();
  if (tabName === 'casernes') renderAdminCasernes();
  if (tabName === 'intranet') renderAdminIntranet();
  if (tabName === 'centre') {
    document.getElementById('adm-centre-nom').value = CONFIG.nom;
    document.getElementById('adm-centre-code').value = CONFIG.centre;
  }
}

function renderAdminIntranet() {
  const container = document.getElementById('adm-intranet-list');
  container.innerHTML = INTRANET_CONFIG.items.map((item, idx) => `
    <div class="card mb-10">
      <div class="card-body">
        <div class="form-group"><label>Titre (${item.id})</label><input type="text" value="${item.title}" onchange="INTRANET_CONFIG.items[${idx}].title=this.value; sauvegarderDonnees();"></div>
        <div class="form-group"><label>Description</label><input type="text" value="${item.desc}" onchange="INTRANET_CONFIG.items[${idx}].desc=this.value; sauvegarderDonnees();"></div>
        <div class="form-group"><label>URL Image</label><input type="text" value="${item.img}" onchange="INTRANET_CONFIG.items[${idx}].img=this.value; sauvegarderDonnees();"></div>
      </div>
    </div>
  `).join('');
}

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
  document.getElementById('mu-id').value = "";
  document.getElementById('mu-lastname').value = "";
  document.getElementById('mu-firstname').value = "";
  document.getElementById('mu-pwd').value = "";
  document.getElementById('mu-grade').value = "Sapeur";
  document.getElementById('mu-tel').value = "06 XX XX XX XX";
  document.getElementById('mu-email').value = "@ptr.fr";
  document.getElementById('mu-photo-preview').src = 'https://www.w3schools.com/howto/img_avatar.png';
  renderRolesCheckboxes([]);
  ouvrirModal('modal-user-admin');
}

function editUserAdmin(idx) {
  currentEditIdx = idx;
  const u = USERS[idx];
  document.getElementById('mu-id').value = u.id;
  document.getElementById('mu-lastname').value = u.lastname || u.name;
  document.getElementById('mu-firstname').value = u.firstname || "";
  document.getElementById('mu-pwd').value = u.pwd;
  document.getElementById('mu-grade').value = u.grade;
  document.getElementById('mu-tel').value = u.tel;
  document.getElementById('mu-email').value = u.email;
  document.getElementById('mu-photo-preview').src = u.photo || 'https://www.w3schools.com/howto/img_avatar.png';
  renderRolesCheckboxes(u.roles || [u.role]);
  ouvrirModal('modal-user-admin');
}

function renderRolesCheckboxes(selectedRoles) {
  const container = document.getElementById('mu-roles-container');
  container.innerHTML = ROLES_DISPONIBLES.map(r => `
    <label style="display:inline-flex; align-items:center; gap:6px; margin-right:15px; cursor:pointer;">
      <input type="checkbox" value="${r}" ${selectedRoles.includes(r) ? 'checked' : ''}> ${r}
    </label>
  `).join('');
}

function getSelectedRoles() {
  return Array.from(document.querySelectorAll('#mu-roles-container input:checked')).map(cb => cb.value);
}

function deleteUserAdmin(idx) {
  if (USERS[idx].id === 'admin') return showToast("Impossible", "error");
  if (confirm("Supprimer ?")) { USERS.splice(idx, 1); synchroniserTout(); renderAdminUsers(); }
}

function sauvegarderUserAdmin() {
  const selectedRoles = getSelectedRoles();
  if (selectedRoles.length === 0) return showToast("Sélectionnez au moins un rôle !", "error");
  const u = {
    id: document.getElementById('mu-id').value,
    lastname: document.getElementById('mu-lastname').value,
    firstname: document.getElementById('mu-firstname').value,
    name: `${document.getElementById('mu-lastname').value} ${document.getElementById('mu-firstname').value}`.trim(),
    pwd: document.getElementById('mu-pwd').value,
    roles: selectedRoles,
    role: selectedRoles[0],
    grade: document.getElementById('mu-grade').value,
    tel: document.getElementById('mu-tel').value,
    email: document.getElementById('mu-email').value,
    photo: document.getElementById('mu-photo-preview').src.startsWith('data:') ? document.getElementById('mu-photo-preview').src : USERS[currentEditIdx]?.photo
  };
  if (currentEditIdx !== null) USERS[currentEditIdx] = u; else USERS.push(u);
  synchroniserTout(); fermerModal(); renderAdminUsers(); showToast("Enregistré !");
}

function handlePhotoUpload(e) {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (ev) => document.getElementById('mu-photo-preview').src = ev.target.result;
    reader.readAsDataURL(file);
  }
}

function renderAnnuaire() {
  const grid = document.getElementById('annuaire-grid');
  if (!grid) return;
  grid.innerHTML = ANNUAIRE.map(c => `
    <div class="card annuaire-card"><div class="card-body">
      <div style="display:flex; align-items:center; gap:15px; margin-bottom:10px;">
        <div class="avatar-md"><img src="${c.photo || 'https://www.w3schools.com/howto/img_avatar.png'}"></div>
        <div><div style="font-weight:700; color:var(--primary); font-size:14px;">${c.nom}</div><div style="font-size:11px; color:var(--text-muted); font-weight:600;">${c.grade}</div></div>
      </div>
      <div style="font-size:12px;">📞 <strong>${c.tel}</strong><br>✉️ ${c.email}</div>
      ${userIsAdmin(currentUser) ? `<button class="btn btn-secondary btn-sm" style="width:100%; margin-top:10px;" onclick="showSection('admin'); showAdminTab('users');">MODIFIER</button>` : ''}
    </div></div>
  `).join('');
}

// ===== PERSISTANCE =====
function chargerDonnees() {
  const d = (key) => localStorage.getItem('systel_' + key);
  if (d('config')) CONFIG = JSON.parse(d('config'));
  if (d('intranet')) INTRANET_CONFIG = JSON.parse(d('intranet'));
  if (d('casernes')) CASERNES = JSON.parse(d('casernes'));
  if (d('engins')) ENGINS = JSON.parse(d('engins'));
  if (d('users')) USERS = JSON.parse(d('users'));
  if (d('planning')) PLANNING = JSON.parse(d('planning'));
  if (d('interventions')) INTERVENTIONS = JSON.parse(d('interventions'));
  if (d('feuilles_garde')) FEUILLES_GARDE = JSON.parse(d('feuilles_garde'));
  if (d('carte_blips')) CARTE_BLIPS = JSON.parse(d('carte_blips'));
}
function sauvegarderDonnees() {
  const s = (key, val) => localStorage.setItem('systel_' + key, JSON.stringify(val));
  s('config', CONFIG); s('intranet', INTRANET_CONFIG); s('casernes', CASERNES); s('engins', ENGINS);
  s('users', USERS); s('planning', PLANNING); s('interventions', INTERVENTIONS);
  s('feuilles_garde', FEUILLES_GARDE); s('carte_blips', CARTE_BLIPS);
}
function startClock() { setInterval(() => { const c = document.getElementById('current-clock'); if (c) c.textContent = new Date().toLocaleTimeString('fr-FR'); }, 1000); }
function initDate() { const el = document.getElementById('center-title'); if (el) el.textContent = `CENTRE ${CONFIG.centre} - ${new Date().toLocaleDateString('fr-FR')} (WEB1)`; }
function showToast(msg, type = '') { const t = document.getElementById('toast'); if (t) { t.textContent = msg; t.className = 'toast show ' + type; setTimeout(() => t.className = 'toast', 3000); } }
function ouvrirModal(id) { document.getElementById('modal-overlay').classList.add('open'); document.getElementById(id).classList.add('open'); }
function fermerModal() { document.getElementById('modal-overlay').classList.remove('open'); document.querySelectorAll('.modal').forEach(m => m.classList.remove('open')); }
function resetSystem() { if (confirm("⚠️ RÉINITIALISER TOUT ?")) { localStorage.clear(); location.reload(); } }

function renderAdminCasernes() {
  const tbody = document.getElementById('adm-casernes-list');
  tbody.innerHTML = CASERNES.map((c, cIdx) => `
    <tr style="background:#edf2f7; font-weight:800;"><td colspan="2">${c.nom}</td></tr>
    ${c.sections.map((s, sIdx) => `
      <tr><td style="padding-left:30px;">${s.nom}</td><td><button class="btn btn-danger btn-sm" onclick="CASERNES[${cIdx}].sections.splice(${sIdx},1); sauvegarderDonnees(); renderAdminCasernes();">✕</button></td></tr>
    `).join('')}
    <tr><td colspan="2"><button class="btn btn-secondary btn-sm" onclick="ajouterSection(${cIdx})">+ Ajouter Section</button></td></tr>
  `).join('');
}
function renderAdminEngins() {
  const tbody = document.getElementById('adm-engins-list');
  const allS = []; CASERNES.forEach(c => c.sections.forEach(s => allS.push({id: s.id, nom: `${c.nom} > ${s.nom}`})));
  tbody.innerHTML = ENGINS.map((e, idx) => `
    <tr>
      <td><input type="text" value="${e.nom}" onchange="ENGINS[${idx}].nom=this.value; sauvegarderDonnees();"></td>
      <td><select onchange="ENGINS[${idx}].section=this.value; sauvegarderDonnees();">${allS.map(s => `<option value="${s.id}" ${e.section === s.id ? 'selected' : ''}>${s.nom}</option>`).join('')}</select></td>
      <td><button class="btn btn-danger btn-sm" onclick="ENGINS.splice(${idx},1); sauvegarderDonnees(); renderAdminEngins();">✕</button></td>
    </tr>
  `).join('');
}
function ajouterEnginAdmin() {
  if (!CASERNES[0] || CASERNES[0].sections.length === 0) return showToast("Créez une section !", "error");
  ENGINS.push({ id: "E"+Date.now(), nom: "NOUVEAU", section: CASERNES[0].sections[0].id, statut: "disponible", berStatut: null, chefAgres: null });
  renderAdminEngins(); sauvegarderDonnees();
}
function sauvegarderToutAdmin() {
  CONFIG.nom = document.getElementById('adm-centre-nom').value;
  CONFIG.centre = document.getElementById('adm-centre-code').value;
  sauvegarderDonnees(); initDate(); showToast("Enregistré !");
}
function ajouterSection(cIdx) {
  const nom = prompt("Nom Section :");
  if (nom) { CASERNES[cIdx].sections.push({ id: nom.toUpperCase().replace(/\s+/g,'-'), nom }); sauvegarderDonnees(); renderAdminCasernes(); }
}

// ===== BIP ALERTES =====
let bipAlerteVisible = false;
let bipSon = null;
function checkBipAlertes() {
  if (!currentUser || bipAlerteVisible) return;
  // Chercher si un engin a un BIP actif pour ce personnel
  const bipData = localStorage.getItem('systel_bip_' + currentUser.id);
  if (bipData) {
    const bip = JSON.parse(bipData);
    if (!bip.acquitte) {
      bipAlerteVisible = true;
      afficherBipAlerte(bip);
    }
  }
}
function afficherBipAlerte(bip) {
  const overlay = document.getElementById('bip-overlay');
  if (!overlay) return;
  document.getElementById('bip-motif').textContent = bip.motif || 'INTERVENTION';
  document.getElementById('bip-engin').textContent = bip.enginNom || '';
  document.getElementById('bip-place').textContent = bip.place || '';
  document.getElementById('bip-inter-num').textContent = bip.interNum || '';
  overlay.style.display = 'flex';
  // Son bip
  try {
    const ctx = new AudioContext();
    function beep(freq, dur) {
      const osc = ctx.createOscillator(); const g = ctx.createGain();
      osc.connect(g); g.connect(ctx.destination);
      osc.frequency.value = freq; osc.type = 'square';
      g.gain.value = 0.3;
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur);
    }
    let t = 0;
    const interval = setInterval(() => { beep(880, 0.1); t++; if (t > 20) clearInterval(interval); }, 600);
    bipSon = interval;
  } catch(e) {}
}
function acquitterBip() {
  if (bipSon) clearInterval(bipSon);
  const bipData = localStorage.getItem('systel_bip_' + currentUser.id);
  if (bipData) {
    const bip = JSON.parse(bipData);
    bip.acquitte = true;
    localStorage.setItem('systel_bip_' + currentUser.id, JSON.stringify(bip));
  }
  document.getElementById('bip-overlay').style.display = 'none';
  bipAlerteVisible = false;
  // Ouvrir le ticket BER si chef d'agrès
  const bipD = JSON.parse(localStorage.getItem('systel_bip_' + currentUser.id) || '{}');
  if (bipD.isChefAgres && bipD.enginId) {
    setTimeout(() => ouvrirBER(bipD.enginId, bipD.interventionId), 500);
  }
}
