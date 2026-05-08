/* ============================================================
   SYSTEL POMPIERS - MODULE SYNOPTIQUE (RÉALISTE)
   ============================================================ */

function updateSynoptique() {
  renderEngins();
  renderPersonnelsSynoptique();
  renderMoyensIntervention();
  
  // Mise à jour des compteurs
  const total = PERSONNELS.length;
  const dispo = PERSONNELS.filter(p => p.disponible).length;
  document.getElementById('total-personnels').textContent = total;
  document.getElementById('dispo-personnels').textContent = dispo;
}

// ===== MOYENS EN INTERVENTION =====
function renderMoyensIntervention() {
  const container = document.getElementById('moyens-intervention');
  if (!container) return;

  const enginsEnIntervention = ENGINS.filter(e => e.statut === 'intervention');

  if (enginsEnIntervention.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); font-style:italic; padding:10px;">Aucun moyen engagé actuellement.</div>';
    return;
  }

  container.innerHTML = enginsEnIntervention.map(e => `
    <div class="intervention-mini-card" onclick="showSection('interventions')">
      <div class="intervention-mini-info">
        <div class="intervention-mini-type">${e.nom}</div>
        <div class="intervention-mini-addr">En intervention opérationnelle</div>
      </div>
      <span class="badge badge-danger">ENGAGÉ</span>
    </div>
  `).join('');
}

// ===== ENGINS =====
function renderEngins() {
  const grid = document.getElementById('engins-grid');
  if (!grid) return;

  const showEngins = document.getElementById('rp-engins')?.checked !== false;
  if (!showEngins) { grid.innerHTML = ''; return; }

  grid.className = "engins-container";
  grid.innerHTML = ENGINS.map(e => {
    const statusClass = `status-${e.statut}`;
    const dotClass = e.statut === 'disponible' ? 'var(--success)' : (e.statut === 'intervention' ? 'var(--accent)' : 'var(--text-muted)');

    return `
      <div class="engin-card ${statusClass}" onclick="toggleEnginStatut('${e.id}')">
        <div class="engin-card-header">
          <span class="engin-name">${e.nom}</span>
          <div class="engin-status-dot" style="background-color: ${dotClass}"></div>
        </div>
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
  showToast(`${engin.nom} : passage au statut ${engin.statut.toUpperCase()}`, engin.statut === 'intervention' ? 'error' : 'success');
}

// ===== PERSONNELS SYNOPTIQUE =====
function renderPersonnelsSynoptique() {
  const grid = document.getElementById('personnels-grid');
  const totalEl = document.getElementById('total-personnels');
  const dispoEl = document.getElementById('dispo-personnels');
  if (!grid) return;

  const showPersonnels = document.getElementById('rp-personnels')?.checked !== false;
  if (!showPersonnels) { grid.innerHTML = ''; return; }

  // Tri
  const triEl = document.querySelector('input[name="rp-tri"]:checked');
  const tri = triEl ? triEl.value : 'nom';

  let liste = [...PERSONNELS];
  if (tri === 'nom') {
    liste.sort((a, b) => a.nom.localeCompare(b.nom));
  } else if (tri === 'etat') {
    const ordre = { 'GARDE 1': 0, 'GARDE 2': 1, 'ASTREINTE': 2, 'C.ORG': 3, 'Repos': 4 };
    liste.sort((a, b) => (ordre[a.statut] ?? 9) - (ordre[b.statut] ?? 9));
  }

  if (totalEl) totalEl.textContent = `Total : ${liste.length}`;
  if (dispoEl) dispoEl.textContent = `Disponibles : ${liste.filter(p => p.disponible).length}`;

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
  showToast(`${p.nom} ${p.prenom} est maintenant ${p.disponible ? 'DISPONIBLE' : 'INDISPONIBLE'}`);
}
