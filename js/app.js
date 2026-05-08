/* ============================================================
   SYSTEL POMPIERS - APPLICATION PRINCIPALE (AUTH & ROLES)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();
  checkAuth();
  startClock();
});

// ===== AUTHENTIFICATION =====
function checkAuth() {
  const savedUser = sessionStorage.getItem('systel_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
    initApp();
  } else {
    document.getElementById('auth-container').style.display = 'flex';
    document.getElementById('app-container').style.display = 'none';
    document.body.className = 'login-page';
  }
}

function handleLogin(e) {
  e.preventDefault();
  const id = document.getElementById('login-id').value;
  const pwd = document.getElementById('login-pwd').value;
  const errorEl = document.getElementById('login-error');

  const user = USERS.find(u => u.id === id && u.pwd === pwd);

  if (user) {
    currentUser = user;
    sessionStorage.setItem('systel_user', JSON.stringify(user));
    errorEl.textContent = "";
    initApp();
  } else {
    errorEl.textContent = "Identifiant ou mot de passe incorrect.";
  }
}

function handleLogout() {
  sessionStorage.removeItem('systel_user');
  location.reload();
}

function initApp() {
  document.getElementById('auth-container').style.display = 'none';
  document.getElementById('app-container').style.display = 'block';
  document.body.className = '';

  // Affichage infos utilisateur
  document.getElementById('user-display-name').textContent = currentUser.name;
  const badge = document.getElementById('user-role-badge');
  badge.textContent = currentUser.role;
  badge.className = 'badge ' + (currentUser.role === 'ADMIN' ? 'badge-admin' : 'badge-bmpm');

  // Restrictions de rôle
  if (currentUser.role === 'ADMIN') {
    document.getElementById('nav-admin').style.display = 'flex';
    document.getElementById('admin-shortcut').style.display = 'inline-block';
  } else {
    document.getElementById('nav-admin').style.display = 'none';
    document.getElementById('admin-shortcut').style.display = 'none';
  }

  // Initialisation UI
  initDate();
  showSection('synoptique');
  updateSynoptique();
  renderInterventions();
  renderPlanning();
  renderPersonnels();
  renderAnnuaire();
}

// ===== PERSISTANCE =====
function chargerDonnees() {
  const savedConfig = localStorage.getItem('systel_config');
  const savedEngins = localStorage.getItem('systel_engins');
  const savedPersonnels = localStorage.getItem('systel_personnels');
  const savedInterventions = localStorage.getItem('systel_interventions');
  const savedUsers = localStorage.getItem('systel_users');

  if (savedConfig) Object.assign(CONFIG, JSON.parse(savedConfig));
  if (savedEngins) ENGINS = JSON.parse(savedEngins);
  if (savedPersonnels) PERSONNELS = JSON.parse(savedPersonnels);
  if (savedInterventions) INTERVENTIONS = JSON.parse(savedInterventions);
  if (savedUsers) USERS = JSON.parse(savedUsers);
}

function sauvegarderDonnees() {
  localStorage.setItem('systel_config', JSON.stringify(CONFIG));
  localStorage.setItem('systel_engins', JSON.stringify(ENGINS));
  localStorage.setItem('systel_personnels', JSON.stringify(PERSONNELS));
  localStorage.setItem('systel_interventions', JSON.stringify(INTERVENTIONS));
  localStorage.setItem('systel_users', JSON.stringify(USERS));
}

// ===== NAVIGATION =====
function showSection(name) {
  // Sécurité Rôle
  if (name === 'admin' && currentUser.role !== 'ADMIN') {
    showToast("Accès refusé : Droits insuffisants", "error");
    return;
  }

  document.querySelectorAll('.section').forEach(s => s.classList.remove('active-section'));
  const target = document.getElementById('section-' + name);
  if (target) target.classList.add('active-section');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('selected');
    if (item.dataset.section === name) item.classList.add('selected');
  });

  const rightPanel = document.getElementById('right-panel');
  if (rightPanel) {
    rightPanel.style.display = (name === 'synoptique') ? 'flex' : 'none';
  }
}

// ===== HORLOGE & DATES =====
function startClock() {
  setInterval(() => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('fr-FR');
    const el = document.getElementById('current-clock');
    if (el) el.textContent = timeStr;
  }, 1000);
}

function initDate() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  document.getElementById('header-date').textContent = dateStr;
  document.getElementById('center-title').textContent = `CENTRE ${CONFIG.centre} - ${dateStr} (WEB1)`;
  
  const garde = document.getElementById('garde-courante');
  if (garde) garde.textContent = `${CONFIG.dateGarde} · ${CONFIG.typeGarde}`;
}

// ===== ADMIN PANEL (USERS) =====
function showAdminTab(tabName) {
  document.querySelectorAll('.admin-tab-content').forEach(tab => tab.style.display = 'none');
  document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(`admin-tab-${tabName}`).style.display = 'block';
  event.target.classList.add('active');

  if (tabName === 'users') renderAdminUsers();
}

function renderAdminUsers() {
  const tbody = document.getElementById('adm-users-list');
  tbody.innerHTML = USERS.map((u, idx) => `
    <tr>
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td><span class="badge ${u.role === 'ADMIN' ? 'badge-admin' : 'badge-bmpm'}">${u.role}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editerUserAdmin(${idx})">Modifier</button>
        <button class="btn btn-danger btn-sm" onclick="supprimerUserAdmin(${idx})">Supprimer</button>
      </td>
    </tr>
  `).join('');
}

let userEditIdx = null;
function ajouterUserAdmin() {
  userEditIdx = null;
  document.getElementById('mu-id').value = "";
  document.getElementById('mu-name').value = "";
  document.getElementById('mu-pwd').value = "";
  document.getElementById('mu-role').value = "BMPM";
  ouvrirModal('modal-user-admin');
}

function editerUserAdmin(idx) {
  userEditIdx = idx;
  const u = USERS[idx];
  document.getElementById('mu-id').value = u.id;
  document.getElementById('mu-name').value = u.name;
  document.getElementById('mu-pwd').value = u.pwd;
  document.getElementById('mu-role').value = u.role;
  ouvrirModal('modal-user-admin');
}

function sauvegarderUserAdmin() {
  const u = {
    id: document.getElementById('mu-id').value,
    name: document.getElementById('mu-name').value,
    pwd: document.getElementById('mu-pwd').value,
    role: document.getElementById('mu-role').value
  };

  if (userEditIdx !== null) USERS[userEditIdx] = u;
  else USERS.push(u);

  sauvegarderDonnees();
  renderAdminUsers();
  fermerModal();
  showToast("Compte utilisateur mis à jour");
}

function supprimerUserAdmin(idx) {
  if (USERS[idx].id === 'admin') return showToast("Impossible de supprimer le compte admin principal", "error");
  if (confirm("Supprimer cet utilisateur ?")) {
    USERS.splice(idx, 1);
    sauvegarderDonnees();
    renderAdminUsers();
  }
}

// ===== UTILS =====
function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}

function ouvrirModal(id) {
  document.getElementById('modal-overlay').classList.add('open');
  document.getElementById(id).classList.add('open');
}

function fermerModal() {
  document.getElementById('modal-overlay').classList.remove('open');
  document.querySelectorAll('.modal').forEach(m => m.classList.remove('open'));
}
