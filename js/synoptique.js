/* ============================================================
   SYSTEL POMPIERS - MODULE SYNOPTIQUE (PTR VERSION v17)
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

function renderPersonnelsSynoptique() {
  const grid = document.getElementById('personnels-grid');
  if (!grid) return;
  
  // FORCER LA SYNCHRO DES STATUTS AVANT LE RENDU
  const currentUserId = sessionStorage.getItem('systel_user') ? JSON.parse(sessionStorage.getItem('systel_user')).id : null;

  grid.innerHTML = USERS.map(u => {
    // Statut : DISPO si c'est l'utilisateur actuel connecté, sinon INDISPO
    const isConnected = (currentUserId === u.id);
    const statut = isConnected ? "DISPO" : "INDISPO";
    const grade = u.grade || (u.role === 'ADMIN' ? 'Officier' : 'Sapeur');
    const nomComplet = `${u.lastname || u.id.toUpperCase()} ${u.firstname || ""}`.trim();

    return `
      <div class="card" style="display:flex; align-items:center; gap:12px; padding:10px; margin-bottom:8px; border-left: 4px solid ${isConnected ? '#48bb78' : '#e53e3e'};">
        <div class="avatar-sm"><img src="${u.photo || 'https://www.w3schools.com/howto/img_avatar.png'}"></div>
        <div style="flex:1;">
          <div style="font-weight:800; font-size:13px; color:var(--primary);">${nomComplet}</div>
          <div style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">${grade}</div>
        </div>
        <span class="badge ${isConnected ? 'badge-success' : 'badge-danger'}" style="font-size:9px;">${statut}</span>
      </div>
    `;
  }).join('');
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
