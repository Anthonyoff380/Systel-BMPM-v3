/* ============================================================
   SYSTEL POMPIERS - MODULE SYNOPTIQUE (BMPM v18 - CORRIGÉ)
   ============================================================ */

function updateSynoptique() {
  const container = document.getElementById('synoptique-main-container');
  if (!container) return;

  container.innerHTML = CASERNES.map(centre => {
    const allSectionsIds = centre.sections.map(s => s.id);
    const enginsDuCentre = ENGINS.filter(e => allSectionsIds.includes(e.section));
    const isCentreActive = enginsDuCentre.length > 0;

    return `
      <div class="centre-group">
        <div class="centre-header" style="background: ${isCentreActive ? '#dcfce7' : '#ccc'}; color: ${isCentreActive ? '#166534' : '#333'};">
          ${centre.nom} ${isCentreActive ? '●' : '○'}
        </div>
        <div class="centre-body">
          ${centre.sections.map(section => {
            const enginsSection = ENGINS.filter(e => e.section === section.id);
            const hasEngins = enginsSection.length > 0;
            const statusColor = hasEngins ? 'green' : 'red';

            return `
              <div class="section-row">
                <div class="section-label ${statusColor}">
                  <div class="section-name">${section.nom}</div>
                  <div class="section-stats">(${enginsSection.length})</div>
                </div>
                <div class="section-engins">
                  ${enginsSection.map(e => `
                    <div class="engin-box ${e.statut}" onclick="toggleEnginStatut('${e.id}')">
                      ${e.nom}
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }).join('');

  renderPersonnelsSynoptique();
}

function toggleEnginStatut(id) {
  const engin = ENGINS.find(e => e.id === id);
  if (!engin) return;
  const cycle = ['disponible', 'intervention', 'indisponible'];
  const idx = cycle.indexOf(engin.statut);
  engin.statut = cycle[(idx + 1) % cycle.length];
  sauvegarderDonnees();
  updateSynoptique();
}

function renderPersonnelsSynoptique() {
  const grid = document.getElementById('personnels-grid');
  if (!grid) return;

  const sessionUser = sessionStorage.getItem('systel_user');
  const connectedId = sessionUser ? JSON.parse(sessionUser).id : null;

  PERSONNELS.forEach(p => {
    const user = USERS.find(u => u.id === p.id);
    p.statut = (connectedId && connectedId === p.id) ? "DISPO" : "INDISPO";
    if (user && user.grade && user.grade !== 'undefined') {
      p.grade = user.grade;
    } else if (!p.grade || p.grade === 'undefined') {
      p.grade = 'Sapeur';
    }
  });

  const dispo = PERSONNELS.filter(p => p.statut === 'DISPO').length;
  const total = PERSONNELS.length;

  grid.className = "personnels-synoptique-grid";
  grid.innerHTML = `
    <div class="personnels-stats-bar">
      <span class="stat-dispo">✔ DISPO : ${dispo}</span>
      <span class="stat-indispo">✖ INDISPO : ${total - dispo}</span>
      <span class="stat-total">TOTAL : ${total}</span>
    </div>
    ${PERSONNELS.map(p => {
      const grade = (p.grade && p.grade !== 'undefined' && p.grade !== '') ? p.grade : 'N/A';
      const isDispo = p.statut === 'DISPO';
      return `
        <div class="personnel-card-syn ${isDispo ? 'syn-dispo' : 'syn-indispo'}" onclick="showPersonnelDetail('${p.id}')">
          <div class="syn-avatar"><img src="${p.photo || 'https://www.w3schools.com/howto/img_avatar.png'}" onerror="this.src='https://www.w3schools.com/howto/img_avatar.png'"></div>
          <div class="syn-info">
            <div class="syn-name">${p.nom} ${p.prenom}</div>
            <div class="syn-grade">${grade}</div>
          </div>
          <span class="badge ${isDispo ? 'badge-success' : 'badge-danger'}">${p.statut}</span>
        </div>
      `;
    }).join('')}
  `;
}

function showPersonnelDetail(pid) {
  const p = PERSONNELS.find(x => x.id === pid);
  const u = USERS.find(x => x.id === pid);
  if (!p) return;

  let grade = 'N/A';
  if (u && u.grade && u.grade !== 'undefined' && u.grade !== '') {
    grade = u.grade;
  } else if (p.grade && p.grade !== 'undefined' && p.grade !== '') {
    grade = p.grade;
  }

  const modal = document.getElementById('modal-personnel-detail');
  if (modal) {
    document.getElementById('pd-img').src = p.photo || 'https://www.w3schools.com/howto/img_avatar.png';
    document.getElementById('pd-nom').textContent = p.nom + ' ' + p.prenom;
    document.getElementById('pd-grade').textContent = grade;
    document.getElementById('pd-role').textContent = u ? u.role : '—';
    document.getElementById('pd-tel').textContent = u ? (u.tel || '—') : '—';
    document.getElementById('pd-email').textContent = u ? (u.email || '—') : '—';
    const statusEl = document.getElementById('pd-statut');
    statusEl.textContent = p.statut;
    statusEl.className = 'badge ' + (p.statut === 'DISPO' ? 'badge-success' : 'badge-danger');
    ouvrirModal('modal-personnel-detail');
  }
}
