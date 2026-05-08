/* ============================================================
   SYSTEL POMPIERS - APP JS (PTR VERSION CORRIGÉE & AUTOMATISÉE)
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
    document.body.classList.add('login-page');
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
  document.getElementById('app-container').style.display = 'flex';
  document.body.classList.remove('login-page');

  // Affichage infos utilisateur
  document.getElementById('user-display-name').textContent = currentUser.name;
  const badge = document.getElementById('user-role-badge');
  badge.textContent = currentUser.role;
  badge.className = 'badge ' + (currentUser.role === 'ADMIN' ? 'badge-danger' : 'badge-info');

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
  const savedAnnuaire = localStorage.getItem('systel_annuaire');
  const savedPlanning = localStorage.getItem('systel_planning');

  if (savedConfig) Object.assign(CONFIG, JSON.parse(savedConfig));
  if (savedEngins) ENGINS = JSON.parse(savedEngins);
  if (savedPersonnels) PERSONNELS = JSON.parse(savedPersonnels);
  if (savedInterventions) INTERVENTIONS = JSON.parse(savedInterventions);
  if (savedUsers) USERS = JSON.parse(savedUsers);
  if (savedAnnuaire) ANNUAIRE = JSON.parse(savedAnnuaire);
  if (savedPlanning) PLANNING = JSON.parse(savedPlanning);
}

function sauvegarderDonnees() {
  localStorage.setItem('systel_config', JSON.stringify(CONFIG));
  localStorage.setItem('systel_engins', JSON.stringify(ENGINS));
  localStorage.setItem('systel_personnels', JSON.stringify(PERSONNELS));
  localStorage.setItem('systel_interventions', JSON.stringify(INTERVENTIONS));
  localStorage.setItem('systel_users', JSON.stringify(USERS));
  localStorage.setItem('systel_annuaire', JSON.stringify(ANNUAIRE));
  localStorage.setItem('systel_planning', JSON.stringify(PLANNING));
}

// ===== NAVIGATION =====
function showSection(name) {
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
    document.getElementById('current-clock').textContent = now.toLocaleTimeString('fr-FR');
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

// ===== ADMIN PANEL =====
function showAdminTab(tabName) {
  document.querySelectorAll('.admin-tab-content').forEach(tab => tab.style.display = 'none');
  document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
  
  document.getElementById(`admin-tab-${tabName}`).style.display = 'block';
  event.target.classList.add('active');

  if (tabName === 'users') renderAdminUsers();
  if (tabName === 'engins') renderAdminEngins();
  if (tabName === 'centre') {
    document.getElementById('adm-centre-nom').value = CONFIG.nom;
    document.getElementById('adm-centre-code').value = CONFIG.centre;
    document.getElementById('adm-centre-ville').value = CONFIG.ville;
  }
}

function renderAdminUsers() {
  const tbody = document.getElementById('adm-users-list');
  tbody.innerHTML = USERS.map((u, idx) => `
    <tr>
      <td>${u.id}</td>
      <td>${u.name}</td>
      <td><span class="badge ${u.role === 'ADMIN' ? 'badge-danger' : 'badge-info'}">${u.role}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editerUserAdmin(${idx})">Modifier</button>
        <button class="btn btn-danger btn-sm" onclick="supprimerUserAdmin(${idx})">Supprimer</button>
      </td>
    </tr>
  `).join('');
}

function renderAdminEngins() {
  const tbody = document.getElementById('adm-engins-list');
  tbody.innerHTML = ENGINS.map((e, idx) => `
    <tr>
      <td><input type="text" value="${e.nom}" onchange="ENGINS[${idx}].nom=this.value; sauvegarderDonnees();"></td>
      <td><input type="text" value="${e.type}" onchange="ENGINS[${idx}].type=this.value; sauvegarderDonnees();"></td>
      <td><button class="btn btn-danger btn-sm" onclick="ENGINS.splice(${idx},1); renderAdminEngins(); sauvegarderDonnees();">Supprimer</button></td>
    </tr>
  `).join('');
}

function ajouterEnginAdmin() {
  ENGINS.push({ id: "NEW"+Date.now(), nom: "NOUVEL ENGIN", type: "FPT", statut: "disponible", etat: "P" });
  renderAdminEngins();
  sauvegarderDonnees();
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
  const id = document.getElementById('mu-id').value;
  const name = document.getElementById('mu-name').value;
  const pwd = document.getElementById('mu-pwd').value;
  const role = document.getElementById('mu-role').value;

  if (!id || !name) return showToast("Veuillez remplir les champs.", "error");

  const u = { id, name, pwd, role };

  if (userEditIdx !== null) {
    // Mise à jour de l'existant
    const oldId = USERS[userEditIdx].id;
    USERS[userEditIdx] = u;
    // Mettre à jour l'effectif correspondant
    const p = PERSONNELS.find(pers => pers.nom.toUpperCase() === name.split(' ')[0].toUpperCase());
    if (p) { p.nom = name.split(' ')[0].toUpperCase(); p.prenom = name.split(' ')[1] || ""; }
  } else {
    // Nouveau compte
    USERS.push(u);
    // CRÉATION AUTOMATIQUE EFFECTIF & ANNUAIRE
    const names = name.split(' ');
    const nom = (names[0] || "NOM").toUpperCase();
    const prenom = names[1] || "Prénom";
    
    const newId = Date.now();
    PERSONNELS.push({
      id: newId,
      nom: nom,
      prenom: prenom,
      grade: role === 'ADMIN' ? 'Officier' : 'Sapeur',
      specialite: "INC",
      statut: "Repos",
      disponible: true
    });

    ANNUAIRE.push({
      id: newId,
      nom: `${nom} ${prenom}`,
      type: "Personnel",
      tel: "06 XX XX XX XX",
      email: `${prenom.toLowerCase()}.${nom.toLowerCase()}@ptr.fr`
    });
  }

  sauvegarderDonnees();
  renderAdminUsers();
  renderPersonnels();
  renderAnnuaire();
  updateSynoptique();
  fermerModal();
  showToast("Compte et effectif synchronisés !");
}

function supprimerUserAdmin(idx) {
  if (USERS[idx].id === 'admin') return showToast("Action impossible.", "error");
  if (confirm("Supprimer ce compte ? (L'effectif lié restera)")) {
    USERS.splice(idx, 1);
    sauvegarderDonnees();
    renderAdminUsers();
  }
}

function sauvegarderToutAdmin() {
  CONFIG.nom = document.getElementById('adm-centre-nom').value;
  CONFIG.centre = document.getElementById('adm-centre-code').value;
  CONFIG.ville = document.getElementById('adm-centre-ville').value;
  sauvegarderDonnees();
  initDate();
  showToast("Configurations enregistrées !");
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

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

function getStatutBadge(statut) {
  const map = {
    'En cours':   '<span class="badge badge-danger">En cours</span>',
    'Terminée':   '<span class="badge badge-success">Terminée</span>',
    'disponible': '<span class="badge badge-success">Disponible</span>',
    'intervention':'<span class="badge badge-danger">Intervention</span>',
    'indisponible':'<span class="badge badge-info">Indisponible</span>',
  };
  return map[statut] || `<span class="badge badge-info">${statut}</span>`;
}

function getGardeClass(type) {
  if (!type) return '';
  if (type.includes('GARDE 1')) return 'cell-g1';
  if (type.includes('GARDE 2')) return 'cell-g2';
  if (type.includes('ASTREINTE')) return 'cell-ast';
  return 'cell-repos';
}

function getGardeShort(type) {
  if (!type) return 'REPOS';
  if (type.includes('GARDE 1')) return 'G1';
  if (type.includes('GARDE 2')) return 'G2';
  if (type.includes('ASTREINTE')) return 'AST';
  return 'REPOS';
}
