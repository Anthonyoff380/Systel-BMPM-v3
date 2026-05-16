/* ============================================================
   SYSTEL POMPIERS - MODULE SYNOPTIQUE (v17 - BER intégré)
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
            return `
              <div class="section-row">
                <div class="section-label ${hasEngins ? 'green' : 'red'}">
                  <div class="section-name">${section.nom}</div>
                  <div class="section-stats">(${(() => {
    const pers = PERSONNELS.filter(p => {
      // Chercher si ce personnel est dans un engin de cette section et disponible
      return enginsSection.some(e => e.chefAgres === p.id || 
        (e.statut === 'disponible' && FEUILLES_GARDE?.[e.id]?.[new Date().toISOString().slice(0,10)]?.equipe?.some(eq => eq.id === p.id)));
    });
    const off = pers.filter(p => { const g=(p.grade||'').toUpperCase(); return g.includes('OFF') || ['LTN','CPT','CDT','LCL','COL','GBR','ADL','GAL','MED','ACH','IPC'].some(x=>g.includes(x)); }).length;
    const soff = pers.filter(p => { const g=(p.grade||'').toUpperCase(); return !g.includes('OFF') && ['ADC','ADJ','BCH','MDC','SGT','CPL','CAP','MEN','QMC'].some(x=>g.includes(x)); }).length;
    const hr = pers.length - off - soff;
    return `${enginsSection.length}/${off}/${soff}/${hr}`;
  })()
}</div>
                </div>
                <div class="section-engins">
                  ${enginsSection.map(e => {
                    const ber = e.berStatut ? BER_STATUTS.find(b => b.code === e.berStatut) : null;
                    let style = '';
                    if (ber && ber.couleur) style = `background:${ber.couleur}; color:white; border-color:${ber.couleur};`;
                    const tooltip = ber ? ber.label : (e.statut === 'intervention' ? 'En intervention' : e.statut);
                    return `
                      <div class="engin-box ${ber ? 'ber-active-box' : e.statut}" style="${style}" 
                           title="${tooltip}" onclick="onEnginClick('${e.id}')">
                        ${e.nom}
                        ${e.berStatut ? `<div class="ber-code-badge">${e.berStatut}</div>` : ''}
                      </div>
                    `;
                  }).join('')}
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

function onEnginClick(id) {
  const engin = ENGINS.find(e => e.id === id);
  if (!engin) return;
  // Vérifier le rôle
  const canToggle = typeof currentUser !== 'undefined' && currentUser &&
    (userHasCOSSIM(currentUser) || userIsSOG(currentUser) || userIsAdmin(currentUser));
  if (!canToggle) {
    showToast('Action réservée aux rôles COSSIM, SOG/CDG et ADMIN', 'info');
    return;
  }
  if (engin.statut === 'intervention') {
    showToast(engin.nom + ' est en intervention — utilisez le panel Interventions', 'info');
    return;
  }
  toggleEnginStatut(id);
}

function toggleEnginStatut(id) {
  const engin = ENGINS.find(e => e.id === id);
  if (!engin) return;
  const cycle = ['disponible', 'indisponible'];
  const idx = cycle.indexOf(engin.statut);
  engin.statut = cycle[(idx + 1) % cycle.length];
  if (engin.statut !== 'intervention') { engin.berStatut = null; engin.chefAgres = null; }
  sauvegarderDonnees();
  updateSynoptique();
  if (typeof renderInterventionsSynoptique === 'function') renderInterventionsSynoptique();
  showToast(engin.nom + " : " + engin.statut);
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
