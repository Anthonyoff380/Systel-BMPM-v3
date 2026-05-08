/* ============================================================
   SYSTEL POMPIERS - MODULE SYNOPTIQUE (PTR VERSION CORRIGÉE)
   ============================================================ */

function updateSynoptique() {
  renderEngins();
  renderPersonnelsSynoptique();
  renderMoyensIntervention();
  
  // Mise à jour des compteurs
  const total = PERSONNELS.length;
  const dispo = PERSONNELS.filter(p => p.disponible).length;
  const totalEl = document.getElementById('total-personnels');
  const dispoEl = document.getElementById('dispo-personnels');
  if (totalEl) totalEl.textContent = total;
  if (dispoEl) dispoEl.textContent = dispo;
}

// ===== MOYENS EN INTERVENTION =====
function renderMoyensIntervention() {
  const container = document.getElementById('moyens-intervention');
  if (!container) return;

  const enginsEnIntervention = ENGINS.filter(e => e.statut === 'intervention');

  if (enginsEnIntervention.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); font-style:italic; padding:10px; font-size:12px;">Aucun moyen engagé.</div>';
    return;
  }

  container.innerHTML = enginsEnIntervention.map(e => `
    <div class="intervention-mini-card">
      <div class="intervention-mini-info">
        <div class="intervention-mini-type">${e.nom}</div>
        <div class="intervention-mini-addr">Opération en cours</div>
      </div>
      <span class="badge badge-danger">ENGAGÉ</span>
    </div>
  `).join('');
}

// ===== ENGINS =====
function renderEngins() {
  const grid = document.getElementById('engins-grid');
  if (!grid) return;

  grid.className = "engins-container";
  grid.innerHTML = ENGINS.map(e => {
    const statusClass = `status-${e.statut}`;
    return `
      <div class="engin-card ${statusClass}" onclick="toggleEnginStatut('${e.id}')">
        <span class="engin-name">${e.nom}</span>
        <span class="engin-type">${e.type}</span>
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

// ===== PERSONNELS SYNOPTIQUE =====
function renderPersonnelsSynoptique() {
  const grid = document.getElementById('personnels-grid');
  if (!grid) return;

  let liste = [...PERSONNELS];
  const triEl = document.querySelector('input[name="rp-tri"]:checked');
  const tri = triEl ? triEl.value : 'nom';

  if (tri === 'nom') {
    liste.sort((a, b) => a.nom.localeCompare(b.nom));
  } else if (tri === 'etat') {
    const ordre = { 'Garde 1': 0, 'Garde 2': 1, 'ASTREINTE': 2, 'Repos': 3 };
    liste.sort((a, b) => (ordre[a.statut] ?? 9) - (ordre[b.statut] ?? 9));
  }

  grid.className = "personnels-container";
  grid.innerHTML = liste.map(p => `
    <div class="personnel-card dispo-${p.disponible}" onclick="togglePersonnelDispo(${p.id})">
      <div class="personnel-info">
        <span class="personnel-name">${p.nom} ${p.prenom}</span>
        <span class="personnel-statut">${p.statut}</span>
      </div>
      <span class="badge ${p.disponible ? 'badge-success' : 'badge-danger'}">${p.disponible ? 'OK' : 'HS'}</span>
    </div>
  `).join('');
}

function togglePersonnelDispo(id) {
  const p = PERSONNELS.find(x => x.id === id);
  if (!p) return;
  p.disponible = !p.disponible;
  sauvegarderDonnees();
  updateSynoptique();
}
