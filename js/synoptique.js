/* ============================================================
   SYSTEL POMPIERS - MODULE SYNOPTIQUE (PTR VERSION v16)
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
                  <div class="section-stats">(${enginsSection.length}/0/0)</div>
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
  
  grid.className = "dashboard-grid";
  grid.innerHTML = PERSONNELS.map(p => `
    <div class="card" style="display:flex; align-items:center; gap:15px; padding:10px;">
      <div class="avatar-sm"><img src="${p.photo || 'https://www.w3schools.com/howto/img_avatar.png'}"></div>
      <div style="flex:1;">
        <div style="font-weight:800; font-size:13px; color:var(--primary);">${p.nom} ${p.prenom}</div>
        <div style="font-size:11px; font-weight:700; color:var(--text-muted);">${p.grade}</div>
      </div>
      <span class="badge ${p.statut === 'DISPO' ? 'badge-success' : 'badge-danger'}">${p.statut}</span>
    </div>
  `).join('');
}
