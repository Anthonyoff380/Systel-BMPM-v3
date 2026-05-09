/* ============================================================
   SYSTEL POMPIERS - APP JS (PTR VERSION v18)
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  chargerDonnees();
  synchroniserTout();
  checkAuth();
  startClock();
  setInterval(() => {
    chargerDonnees();
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

  // ERP
  const el = document.getElementById('adm-erp-list');
  if (el) el.innerHTML = COSSIM_CONFIG.erp.map((v,i) => `
    <div class="adm-list-item"><span>${v}</span>
    <button class="btn btn-danger btn-sm" onclick="removeCossimItem('erp',${i})">✕</button></div>`).join('');

  // Services
  const sl = document.getElementById('adm-services-list');
  if (sl) sl.innerHTML = COSSIM_CONFIG.services.map((v,i) => `
    <div class="adm-list-item"><span>${v}</span>
    <button class="btn btn-danger btn-sm" onclick="removeCossimItem('services',${i})">✕</button></div>`).join('');

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
function removeCossimItem(key, idx) {
  COSSIM_CONFIG[key].splice(idx, 1);
  sauvegarderDonnees();
  refreshAdminCossimLists();
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
    <label style="display:inline-flex;align-items:center;gap:6px;margin-right:15px;cursor:pointer;">
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
    roles: selectedRoles, role: selectedRoles[0],
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
  if (file) { const r = new FileReader(); r.onload = ev => document.getElementById('mu-photo-preview').src = ev.target.result; r.readAsDataURL(file); }
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
  if (d('engins')) ENGINS = JSON.parse(d('engins'));
  if (d('users')) USERS = JSON.parse(d('users'));
  if (d('planning')) PLANNING = JSON.parse(d('planning'));
  if (d('interventions')) INTERVENTIONS = JSON.parse(d('interventions'));
  if (d('feuilles_garde')) FEUILLES_GARDE = JSON.parse(d('feuilles_garde'));
  if (d('carte_blips')) CARTE_BLIPS = JSON.parse(d('carte_blips'));
  if (d('cossim_config')) COSSIM_CONFIG = JSON.parse(d('cossim_config'));
}
function sauvegarderDonnees() {
  const s = (k, v) => localStorage.setItem('systel_' + k, JSON.stringify(v));
  s('config',CONFIG); s('intranet',INTRANET_CONFIG); s('casernes',CASERNES); s('engins',ENGINS);
  s('users',USERS); s('planning',PLANNING); s('interventions',INTERVENTIONS);
  s('feuilles_garde',FEUILLES_GARDE); s('carte_blips',CARTE_BLIPS); s('cossim_config',COSSIM_CONFIG);
}
function startClock() { setInterval(() => { const c = document.getElementById('current-clock'); if (c) c.textContent = new Date().toLocaleTimeString('fr-FR'); }, 1000); }
function initDate() { const el = document.getElementById('center-title'); if (el) el.textContent = `CENTRE ${CONFIG.centre} - ${new Date().toLocaleDateString('fr-FR')} (WEB1)`; }
function showToast(msg, type='') { const t = document.getElementById('toast'); if (t) { t.textContent = msg; t.className = 'toast show '+type; setTimeout(() => t.className='toast', 3000); } }
function ouvrirModal(id) { document.getElementById('modal-overlay').classList.add('open'); document.getElementById(id).classList.add('open'); }
function fermerModal() { document.getElementById('modal-overlay').classList.remove('open'); document.querySelectorAll('.modal').forEach(m => m.classList.remove('open')); }
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
        <td><button class="btn btn-danger btn-sm" onclick="ENGINS.splice(${idx},1);sauvegarderDonnees();renderAdminEngins();">✕</button></td>
      </tr>`;
    });
  });
  tbody.innerHTML = html;
  // Mettre à jour le thead
  const thead = tbody.closest('table').querySelector('thead tr');
  if (thead && thead.children.length < 4) thead.innerHTML = '<th>Nom</th><th>Section</th><th>Postes</th><th>Actions</th>';
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
    }
  }
}

function afficherBipAlerte(bip) {
  const overlay = document.getElementById('bip-overlay');
  if (!overlay) return;
  // Infos au dessus
  document.getElementById('bip-motif').textContent = bip.motif || 'INTERVENTION';
  document.getElementById('bip-engin').textContent = bip.enginNom || '';
  document.getElementById('bip-inter-num').textContent = bip.interNum || '';
  document.getElementById('bip-place').textContent = bip.place || 'En attente';
  // Écran vert — infos bien lisibles
  const motifCourt = (bip.motif || 'INTERVENTION').substring(0, 40);
  document.getElementById('bip-screen-motif').textContent = motifCourt;
  document.getElementById('bip-screen-engin').textContent = bip.enginNom || '';
  document.getElementById('bip-screen-place').textContent = 'Place: ' + (bip.place || '?');
  document.getElementById('bip-screen-num').textContent = bip.interNum || '';
  overlay.style.display = 'flex';
  // Lecture son bip en boucle
  try {
    bipAudio = new Audio('sounds/bip.mp3');
    bipAudio.loop = true;
    bipAudio.volume = 1.0;
    bipAudio.play().catch(() => {});
  } catch(e) {}
}

function acquitterBip() {
  // Arrêter le son bip
  if (bipAudio) { bipAudio.pause(); bipAudio.currentTime = 0; bipAudio = null; }
  // Jouer son acquittement
  try {
    const acq = new Audio('sounds/acquittement.mp3');
    acq.volume = 1.0;
    acq.play().catch(() => {});
  } catch(e) {}
  // Marquer acquitté
  const bipData = localStorage.getItem('systel_bip_' + currentUser.id);
  if (bipData) {
    const bip = JSON.parse(bipData);
    bip.acquitte = true;
    localStorage.setItem('systel_bip_' + currentUser.id, JSON.stringify(bip));
    // Ouvrir ticket départ si chef d'agrès (poste C/A = index 0)
    if (bip.isChefAgres) {
      const params = new URLSearchParams({
        motif: bip.motif || '',
        engin: bip.enginNom || '',
        inter: bip.interNum || '',
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