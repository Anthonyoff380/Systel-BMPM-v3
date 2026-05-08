/* ============================================================
   SYSTEL POMPIERS - MODULE SYNOPTIQUE (PTR VERSION v5 - PRO)
   ============================================================ */

function updateSynoptique() {
  const container = document.getElementById('synoptique-main-container');
  if (!container) return;

  // Générer le HTML basé sur CASERNES
  container.innerHTML = CASERNES.map(centre => `
    <div class="centre-group">
      <div class="centre-header">${centre.nom}</div>
      <div class="centre-body">
        ${centre.sections.map(section => {
          const enginsSection = ENGINS.filter(e => e.section === section.id);
          return `
            <div class="section-row">
              <div class="section-label ${section.color}">
                <div class="section-name">${section.nom}</div>
                <div class="section-stats">(0/0/0)</div>
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
  `).join('');
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
