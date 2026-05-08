/* ============================================================
   SYSTEL POMPIERS - APP JS (PTR VERSION v11 - FIX EFFECTIFS)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();
  synchroniserTout();
  checkAuth();
  startClock();
});

// ===== SYNCHRONISATION STRICTE =====
function synchroniserTout() {
  USERS.forEach(u => {
    if (!u.tel) u.tel = "06 XX XX XX XX";
    if (!u.email) u.email = `${u.id}@ptr.fr`;
    if (!u.grade) u.grade = u.grade || (u.role === 'ADMIN' ? 'Officier' : 'Sapeur');
  });

  PERSONNELS = USERS.map(u => {
    const names = u.name.split(' ');
    return {
      id: u.id,
      nom: (names[0] || u.id).toUpperCase(),
      prenom: names.slice(1).join(' ') || "",
      grade: u.grade,
      photo: u.photo
    };
  });

  ANNUAIRE = USERS.map(u => ({
    id: u.id,
    nom: u.name,
    grade: u.grade,
    tel: u.tel,
    email: u.email,
    photo: u.photo
  }));

  USERS.forEach(u => { if (!PLANNING[u.id]) PLANNING[u.id] = {}; });
  sauvegarderDonnees();
}

// ===== AUTHENTIFICATION =====
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
    initApp();
  } else {
    document.getElementById('login-error').textContent = "Identifiant ou mot de passe incorrect.";
  }
}

function handleLogout() { sessionStorage.removeItem('systel_user'); location.reload(); }

function initApp() {
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('app-container').style.display = 'flex';
  document.body.classList.remove('login-page');

  document.getElementById('user-display-name').textContent = currentUser.name;
  document.getElementById('top-avatar-img').src = currentUser.photo || 'https://www.w3schools.com/howto/img_avatar.png';
  const badge = document.getElementById('user-role-badge');
  badge.textContent = currentUser.role;
  badge.className = 'badge ' + (currentUser.role === 'ADMIN' ? 'badge-danger' : 'badge-info');

  document.getElementById('nav-admin').style.display = (currentUser.role === 'ADMIN') ? 'flex' : 'none';

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
  if (name === 'planning') renderPlanning();
  if (name === 'personnels') renderPersonnels();
  if (name === 'annuaire') renderAnnuaire();
  if (name === 'admin') showAdminTab('centre');
}

function openProfilMenu() {
  document.getElementById('prof-name').textContent = currentUser.name;
  document.getElementById('prof-grade').textContent = currentUser.grade;
  document.getElementById('prof-role').textContent = currentUser.role;
  document.getElementById('prof-img').src = currentUser.photo || 'https://www.w3schools.com/howto/img_avatar.png';
  ouvrirModal('modal-profil');
}

// ===== ADMIN =====
function showAdminTab(tabName) {
  document.querySelectorAll('.admin-tab-content').forEach(tab => tab.style.display = 'none');
  document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
  const target = document.getElementById(`admin-tab-${tabName}`);
  if (target) target.style.display = 'block';
  event.target.classList.add('active');

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
        <div class="form-group"><label>URL Image (Carré)</label><input type="text" value="${item.img}" onchange="INTRANET_CONFIG.items[${idx}].img=this.value; sauvegarderDonnees();"></div>
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
      <td>${u.name}</td>
      <td>${u.role}</td>
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
  document.getElementById('mu-name').value = "";
  document.getElementById('mu-pwd').value = "";
  document.getElementById('mu-grade').value = "Sapeur";
  document.getElementById('mu-tel').value = "06 XX XX XX XX";
  document.getElementById('mu-email').value = "@ptr.fr";
  document.getElementById('mu-photo-preview').src = 'https://www.w3schools.com/howto/img_avatar.png';
  ouvrirModal('modal-user-admin');
}

function editUserAdmin(idx) {
  currentEditIdx = idx;
  const u = USERS[idx];
  document.getElementById('mu-id').value = u.id;
  document.getElementById('mu-name').value = u.name;
  document.getElementById('mu-pwd').value = u.pwd;
  document.getElementById('mu-role').value = u.role;
  document.getElementById('mu-grade').value = u.grade;
  document.getElementById('mu-tel').value = u.tel;
  document.getElementById('mu-email').value = u.email;
  document.getElementById('mu-photo-preview').src = u.photo || 'https://www.w3schools.com/howto/img_avatar.png';
  ouvrirModal('modal-user-admin');
}

function deleteUserAdmin(idx) {
  if (USERS[idx].id === 'admin') return showToast("Impossible", "error");
  if (confirm("Supprimer ?")) { USERS.splice(idx, 1); synchroniserTout(); renderAdminUsers(); }
}

function sauvegarderUserAdmin() {
  const u = {
    id: document.getElementById('mu-id').value,
    name: document.getElementById('mu-name').value,
    pwd: document.getElementById('mu-pwd').value,
    role: document.getElementById('mu-role').value,
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

// ===== RENDU MODULES =====
function renderPersonnels() {
  const grid = document.getElementById('effectifs-grid-v13');
  if (!grid) return;
  grid.innerHTML = PERSONNELS.map(p => `
    <div class="effectif-card-pro">
      <div class="avatar-md"><img src="${p.photo || 'https://www.w3schools.com/howto/img_avatar.png'}"></div>
      <div class="info">
        <div class="name">${p.nom} ${p.prenom}</div>
        <div class="grade">${p.grade}</div>
      </div>
      ${currentUser.role === 'ADMIN' ? `<button class="btn btn-secondary btn-sm" onclick="showSection('admin'); showAdminTab('users');">⚙️</button>` : ''}
    </div>
  `).join('');
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
      ${currentUser.role === 'ADMIN' ? `<button class="btn btn-secondary btn-sm" style="width:100%; margin-top:10px;" onclick="showSection('admin'); showAdminTab('users');">MODIFIER</button>` : ''}
    </div></div>
  `).join('');
}

// ===== PERSISTANCE & UTILS =====
function chargerDonnees() {
  const d = (key) => localStorage.getItem('systel_' + key);
  if (d('config')) CONFIG = JSON.parse(d('config'));
  if (d('intranet')) INTRANET_CONFIG = JSON.parse(d('intranet'));
  if (d('casernes')) CASERNES = JSON.parse(d('casernes'));
  if (d('engins')) ENGINS = JSON.parse(d('engins'));
  if (d('users')) USERS = JSON.parse(d('users'));
  if (d('planning')) PLANNING = JSON.parse(d('planning'));
}
function sauvegarderDonnees() {
  const s = (key, val) => localStorage.setItem('systel_' + key, JSON.stringify(val));
  s('config', CONFIG); s('intranet', INTRANET_CONFIG); s('casernes', CASERNES); s('engins', ENGINS); s('users', USERS); s('planning', PLANNING);
}
function startClock() { setInterval(() => { const c = document.getElementById('current-clock'); if (c) c.textContent = new Date().toLocaleTimeString('fr-FR'); }, 1000); }
function initDate() { const el = document.getElementById('center-title'); if (el) el.textContent = `CENTRE ${CONFIG.centre} - ${new Date().toLocaleDateString('fr-FR')} (WEB1)`; }
function showToast(msg, type = '') { const t = document.getElementById('toast'); if (t) { t.textContent = msg; t.className = 'toast show ' + type; setTimeout(() => t.className = 'toast', 3000); } }
function ouvrirModal(id) { document.getElementById('modal-overlay').classList.add('open'); document.getElementById(id).classList.add('open'); }
function fermerModal() { document.getElementById('modal-overlay').classList.remove('open'); document.querySelectorAll('.modal').forEach(m => m.classList.remove('open')); }

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
  if (CASERNES[0].sections.length === 0) return showToast("Créez une section !", "error");
  ENGINS.push({ id: "E"+Date.now(), nom: "NOUVEAU", section: CASERNES[0].sections[0].id, statut: "disponible" });
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
