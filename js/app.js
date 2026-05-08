/* ============================================================
   SYSTEL POMPIERS - APP JS (PTR VERSION v6 - LIAISON STRICTE)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();
  synchroniserTout(); // Assurer que les listes sont raccordées aux utilisateurs
  checkAuth();
  startClock();
});

// ===== SYNCHRONISATION STRICTE =====
function synchroniserTout() {
  // On reconstruit PERSONNELS et ANNUAIRE à partir de USERS pour éviter les résidus
  PERSONNELS = USERS.map(u => {
    const names = u.name.split(' ');
    return {
      id: u.id,
      nom: (names[0] || u.id).toUpperCase(),
      prenom: names[1] || "",
      grade: u.role === 'ADMIN' ? 'Officier' : 'Sapeur',
      specialite: "INC",
      statut: "Garde",
      disponible: true
    };
  });

  ANNUAIRE = USERS.map(u => ({
    id: u.id,
    nom: u.name,
    type: "Personnel",
    tel: "06 XX XX XX XX",
    email: `${u.id}@ptr.fr`
  }));

  // On s'assure que le planning a des entrées pour chaque utilisateur
  USERS.forEach(u => {
    if (!PLANNING[u.id]) PLANNING[u.id] = {};
  });

  sauvegarderDonnees();
}

// ===== AUTHENTIFICATION =====
function checkAuth() {
  const savedUser = sessionStorage.getItem('systel_user');
  if (savedUser) {
    currentUser = JSON.parse(savedUser);
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

  if (currentUser.role === 'ADMIN') {
    document.getElementById('nav-admin').style.display = 'flex';
    document.getElementById('admin-shortcut').style.display = 'inline-block';
  } else {
    document.getElementById('nav-admin').style.display = 'none';
    document.getElementById('admin-shortcut').style.display = 'none';
  }

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
  const d = (key) => localStorage.getItem('systel_' + key);
  if (d('config')) CONFIG = JSON.parse(d('config'));
  if (d('casernes')) CASERNES = JSON.parse(d('casernes'));
  if (d('engins')) ENGINS = JSON.parse(d('engins'));
  if (d('users')) USERS = JSON.parse(d('users'));
  if (d('interventions')) INTERVENTIONS = JSON.parse(d('interventions'));
  if (d('planning')) PLANNING = JSON.parse(d('planning'));
}

function sauvegarderDonnees() {
  const s = (key, val) => localStorage.setItem('systel_' + key, JSON.stringify(val));
  s('config', CONFIG);
  s('casernes', CASERNES);
  s('engins', ENGINS);
  s('users', USERS);
  s('interventions', INTERVENTIONS);
  s('planning', PLANNING);
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
}

// ===== ADMIN PANEL =====
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
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td>${u.role}</td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="USERS.splice(${idx},1); synchroniserTout(); renderAdminUsers();">Supprimer</button>
      </td>
    </tr>
  `).join('');
}

function ajouterUserAdmin() {
  const id = prompt("Identifiant :");
  const name = prompt("Nom complet :");
  const pwd = prompt("Mot de passe :");
  const role = prompt("Rôle (ADMIN ou BMPM) :", "BMPM").toUpperCase();
  if (id && name && pwd) {
    USERS.push({ id, name, pwd, role });
    synchroniserTout();
    renderAdminUsers();
    showToast("Compte créé et synchronisé !");
  }
}

function renderAdminCasernes() {
  const tbody = document.getElementById('adm-casernes-list');
  tbody.innerHTML = CASERNES.map((c, cIdx) => `
    <tr style="background:#edf2f7; font-weight:800;"><td colspan="2">${c.nom}</td></tr>
    ${c.sections.map((s, sIdx) => `
      <tr>
        <td style="padding-left:30px;">${s.nom}</td>
        <td>
          <button class="btn btn-danger btn-sm" onclick="CASERNES[${cIdx}].sections.splice(${sIdx},1); sauvegarderDonnees(); renderAdminCasernes();">✕</button>
        </td>
      </tr>
    `).join('')}
    <tr>
      <td colspan="2"><button class="btn btn-secondary btn-sm" onclick="ajouterSection(${cIdx})">+ Ajouter Section</button></td>
    </tr>
  `).join('');
}

function ajouterSection(cIdx) {
  const nom = prompt("Nom de la section (ex: 6 - PTR) :");
  if (nom) {
    const id = nom.replace(/\s+/g, '-').toUpperCase();
    CASERNES[cIdx].sections.push({ id, nom });
    sauvegarderDonnees();
    renderAdminCasernes();
  }
}

function renderAdminEngins() {
  const tbody = document.getElementById('adm-engins-list');
  // Créer la liste des sections pour le select
  const allSections = [];
  CASERNES.forEach(c => c.sections.forEach(s => allSections.push({ id: s.id, nom: `${c.nom} > ${s.nom}` })));

  tbody.innerHTML = ENGINS.map((e, idx) => `
    <tr>
      <td><input type="text" value="${e.nom}" onchange="ENGINS[${idx}].nom=this.value; sauvegarderDonnees();"></td>
      <td>
        <select onchange="ENGINS[${idx}].section=this.value; sauvegarderDonnees();">
          ${allSections.map(s => `<option value="${s.id}" ${e.section === s.id ? 'selected' : ''}>${s.nom}</option>`).join('')}
        </select>
      </td>
      <td><button class="btn btn-danger btn-sm" onclick="ENGINS.splice(${idx},1); sauvegarderDonnees(); renderAdminEngins();">✕</button></td>
    </tr>
  `).join('');
}

function ajouterEnginAdmin() {
  if (CASERNES[0].sections.length === 0) return showToast("Créez d'abord une section !", "error");
  ENGINS.push({ id: "E"+Date.now(), nom: "NOUVEL ENGIN", section: CASERNES[0].sections[0].id, statut: "disponible" });
  renderAdminEngins();
  sauvegarderDonnees();
}

// ===== UTILS =====
function startClock() {
  setInterval(() => {
    const now = new Date();
    const clock = document.getElementById('current-clock');
    if (clock) clock.textContent = now.toLocaleTimeString('fr-FR');
  }, 1000);
}

function initDate() {
  const now = new Date();
  const dateStr = now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const el = document.getElementById('center-title');
  if (el) el.textContent = `CENTRE ${CONFIG.centre} - ${dateStr} (WEB1)`;
}

function showToast(msg, type = '') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = msg;
  toast.className = 'toast show ' + type;
  setTimeout(() => { toast.className = 'toast'; }, 3000);
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getStatutBadge(statut) {
  const map = { 'En cours': 'badge-danger', 'Terminée': 'badge-success' };
  return `<span class="badge ${map[statut] || 'badge-info'}">${statut}</span>`;
}

function getGardeClass(type) {
  if (type?.includes('G1')) return 'cell-g1';
  if (type?.includes('G2')) return 'cell-g2';
  return 'cell-repos';
}

function getGardeShort(type) { return type || 'REPOS'; }
