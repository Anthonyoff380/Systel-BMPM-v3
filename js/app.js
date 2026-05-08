/* ============================================================
   SYSTEL POMPIERS - APP JS (PTR VERSION v7 - PROFIL & PHOTOS)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();
  synchroniserTout();
  checkAuth();
  startClock();
});

// ===== SYNCHRONISATION STRICTE AVEC PHOTOS =====
function synchroniserTout() {
  PERSONNELS = USERS.map(u => {
    const names = u.name.split(' ');
    return {
      id: u.id,
      nom: (names[0] || u.id).toUpperCase(),
      prenom: names[1] || "",
      grade: u.grade || (u.role === 'ADMIN' ? 'Officier' : 'Sapeur'),
      statut: "Garde",
      disponible: true,
      photo: u.photo
    };
  });

  ANNUAIRE = USERS.map(u => ({
    id: u.id,
    nom: u.name,
    type: "Personnel",
    tel: u.tel || "06 XX XX XX XX",
    email: u.email || `${u.id}@ptr.fr`,
    photo: u.photo,
    grade: u.grade || "Pompier"
  }));

  USERS.forEach(u => { if (!PLANNING[u.id]) PLANNING[u.id] = {}; });
  sauvegarderDonnees();
}

// ===== AUTHENTIFICATION =====
function checkAuth() {
  const savedUser = sessionStorage.getItem('systel_user');
  if (savedUser) {
    currentUser = USERS.find(u => u.id === JSON.parse(savedUser).id) || JSON.parse(savedUser);
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

function handleLogout() {
  sessionStorage.removeItem('systel_user');
  location.reload();
}

function initApp() {
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('app-container').style.display = 'flex';
  document.body.classList.remove('login-page');

  document.getElementById('user-display-name').textContent = currentUser.name;
  const badge = document.getElementById('user-role-badge');
  badge.textContent = currentUser.role;
  badge.className = 'badge ' + (currentUser.role === 'ADMIN' ? 'badge-danger' : 'badge-info');

  // Menu latéral Admin
  document.getElementById('nav-admin').style.display = (currentUser.role === 'ADMIN') ? 'flex' : 'none';

  initDate();
  showSection('synoptique');
}

// ===== NAVIGATION & MODALES =====
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
}

function openProfilMenu() {
  document.getElementById('prof-name').textContent = currentUser.name;
  document.getElementById('prof-grade').textContent = currentUser.grade || "Non défini";
  document.getElementById('prof-role').textContent = currentUser.role;
  const img = document.getElementById('prof-img');
  img.src = currentUser.photo || 'https://www.w3schools.com/howto/img_avatar.png';
  ouvrirModal('modal-profil');
}

// ===== ADMIN & GESTION =====
function showAdminTab(tabName) {
  document.querySelectorAll('.admin-tab-content').forEach(tab => tab.style.display = 'none');
  document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`admin-tab-${tabName}`).style.display = 'block';
  event.target.classList.add('active');
  if (tabName === 'users') renderAdminUsers();
  if (tabName === 'engins') renderAdminEngins();
  if (tabName === 'casernes') renderAdminCasernes();
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
function editUserAdmin(idx) {
  currentEditIdx = idx;
  const u = USERS[idx];
  document.getElementById('mu-id').value = u.id;
  document.getElementById('mu-name').value = u.name;
  document.getElementById('mu-pwd').value = u.pwd;
  document.getElementById('mu-role').value = u.role;
  document.getElementById('mu-grade').value = u.grade || "Sapeur";
  document.getElementById('mu-photo-preview').src = u.photo || 'https://www.w3schools.com/howto/img_avatar.png';
  ouvrirModal('modal-user-admin');
}

function deleteUserAdmin(idx) {
  if (USERS[idx].id === 'admin') return showToast("Impossible de supprimer l'admin principal", "error");
  if (confirm("Supprimer ce compte et toutes les données liées ?")) {
    USERS.splice(idx, 1);
    synchroniserTout();
    renderAdminUsers();
  }
}

function handlePhotoUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      document.getElementById('mu-photo-preview').src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
}

function sauvegarderUserAdmin() {
  const id = document.getElementById('mu-id').value;
  const name = document.getElementById('mu-name').value;
  const pwd = document.getElementById('mu-pwd').value;
  const role = document.getElementById('mu-role').value;
  const grade = document.getElementById('mu-grade').value;
  const photo = document.getElementById('mu-photo-preview').src;

  const userData = { id, name, pwd, role, grade, photo: photo.startsWith('data:') ? photo : null };

  if (currentEditIdx !== null) {
    USERS[currentEditIdx] = Object.assign(USERS[currentEditIdx], userData);
  } else {
    USERS.push(userData);
  }

  synchroniserTout();
  fermerModal();
  renderAdminUsers();
  showToast("Compte enregistré !");
}

// ===== RENDU MODULES =====
function renderPersonnels() {
  const tbody = document.getElementById('personnels-tbody');
  if (!tbody) return;
  tbody.innerHTML = PERSONNELS.map(p => `
    <tr>
      <td><div class="avatar-sm"><img src="${p.photo || 'https://www.w3schools.com/howto/img_avatar.png'}"></div></td>
      <td style="font-weight:700;">${p.nom}</td>
      <td>${p.prenom}</td>
      <td><span class="badge badge-info">${p.grade}</span></td>
      <td><span class="badge ${p.disponible ? 'badge-success' : 'badge-danger'}">${p.statut}</span></td>
      <td>
        ${currentUser.role === 'ADMIN' ? `<button class="btn btn-secondary btn-sm" onclick="showSection('admin'); showAdminTab('users');">Gérer</button>` : ''}
      </td>
    </tr>
  `).join('');
}

function renderAnnuaire() {
  const grid = document.getElementById('annuaire-grid');
  if (!grid) return;
  grid.innerHTML = ANNUAIRE.map(c => `
    <div class="card annuaire-card">
      <div class="card-body">
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:10px;">
          <div class="avatar-md"><img src="${c.photo || 'https://www.w3schools.com/howto/img_avatar.png'}"></div>
          <div>
            <div style="font-weight:700; color:var(--primary); font-size:14px;">${c.nom}</div>
            <div style="font-size:11px; color:var(--text-muted); font-weight:600;">${c.grade}</div>
          </div>
        </div>
        <div style="font-size:12px; display:flex; flex-direction:column; gap:5px;">
          <div>📞 <strong>${c.tel}</strong></div>
          <div>✉️ ${c.email}</div>
        </div>
        ${currentUser.role === 'ADMIN' ? `<button class="btn btn-secondary btn-sm" style="width:100%; margin-top:10px;" onclick="showSection('admin'); showAdminTab('users');">Modifier</button>` : ''}
      </div>
    </div>
  `).join('');
}

// ===== PERSISTANCE & UTILS =====
function chargerDonnees() {
  const d = (key) => localStorage.getItem('systel_' + key);
  if (d('config')) CONFIG = JSON.parse(d('config'));
  if (d('casernes')) CASERNES = JSON.parse(d('casernes'));
  if (d('engins')) ENGINS = JSON.parse(d('engins'));
  if (d('users')) USERS = JSON.parse(d('users'));
  if (d('planning')) PLANNING = JSON.parse(d('planning'));
}

function sauvegarderDonnees() {
  const s = (key, val) => localStorage.setItem('systel_' + key, JSON.stringify(val));
  s('config', CONFIG); s('casernes', CASERNES); s('engins', ENGINS); s('users', USERS); s('planning', PLANNING);
}

function startClock() { setInterval(() => { const clock = document.getElementById('current-clock'); if (clock) clock.textContent = new Date().toLocaleTimeString('fr-FR'); }, 1000); }
function initDate() { const el = document.getElementById('center-title'); if (el) el.textContent = `CENTRE ${CONFIG.centre} - ${new Date().toLocaleDateString('fr-FR')} (WEB1)`; }
function showToast(msg, type = '') { const toast = document.getElementById('toast'); if (!toast) return; toast.textContent = msg; toast.className = 'toast show ' + type; setTimeout(() => { toast.className = 'toast'; }, 3000); }
function ouvrirModal(id) { document.getElementById('modal-overlay').classList.add('open'); document.getElementById(id).classList.add('open'); }
function fermerModal() { document.getElementById('modal-overlay').classList.remove('open'); document.querySelectorAll('.modal').forEach(m => m.classList.remove('open')); }
