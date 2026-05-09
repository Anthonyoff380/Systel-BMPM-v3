/* ============================================================
   SYSTEL POMPIERS - MODULE FEUILLE DE GARDE (v17)
   Accessible par SOG/CDG et ADMIN pour créer
   Visible par tous en lecture
   ============================================================ */

function renderFeuilleGarde() {
  const container = document.getElementById('feuille-garde-container');
  if (!container) return;

  const canEdit = userIsSOG(currentUser);

  // Sélecteur d'engin
  const enginsOptions = ENGINS.map(e => `<option value="${e.id}">${e.nom}</option>`).join('');
  
  let html = `<div class="fg-toolbar">
    <div class="fg-select-group">
      <label>Engin :</label>
      <select id="fg-engin-select" onchange="chargerFeuilleGarde()">
        ${enginsOptions}
      </select>
    </div>
    <div class="fg-select-group">
      <label>Date :</label>
      <input type="date" id="fg-date-select" value="${new Date().toISOString().slice(0,10)}" onchange="chargerFeuilleGarde()">
    </div>
    ${canEdit ? `<button class="btn btn-primary btn-sm" onclick="creerFeuilleGarde()">+ Créer Feuille</button>` : ''}
  </div>
  <div id="fg-content"></div>`;

  container.innerHTML = html;
  chargerFeuilleGarde();
}

function chargerFeuilleGarde() {
  const enginId = document.getElementById('fg-engin-select')?.value;
  const date = document.getElementById('fg-date-select')?.value;
  if (!enginId || !date) return;

  const engin = ENGINS.find(e => e.id === enginId);
  const feuille = FEUILLES_GARDE[enginId]?.[date];
  const container = document.getElementById('fg-content');
  const canEdit = userIsSOG(currentUser);

  if (!feuille) {
    container.innerHTML = `<div class="fg-empty">
      <div style="font-size:48px; margin-bottom:15px;">📋</div>
      <div style="font-weight:700; color:#718096;">Aucune feuille de garde pour ${engin?.nom} le ${date}</div>
      ${canEdit ? `<button class="btn btn-primary" style="margin-top:15px;" onclick="creerFeuilleGarde()">+ Créer la feuille de garde</button>` : ''}
    </div>`;
    return;
  }

  const personnelsOptions = PERSONNELS.map(p => `<option value="${p.id}">${p.nom} ${p.prenom} (${p.grade})</option>`).join('');

  let equipiers = feuille.equipe || [];
  
  container.innerHTML = `
    <div class="fg-card">
      <div class="fg-card-header">
        <div>
          <div class="fg-title">🚒 FEUILLE DE GARDE — ${engin?.nom || enginId}</div>
          <div class="fg-subtitle">Date : ${date} • Créée par : ${feuille.creePar || '--'}</div>
        </div>
        <div class="badge ${feuille.status === 'validée' ? 'badge-success' : 'badge-warning'}">${feuille.status || 'brouillon'}</div>
      </div>
      <div class="fg-body">
        <table class="data-table">
          <thead><tr><th>#</th><th>Nom</th><th>Grade</th><th>Fonction</th>${canEdit ? '<th>Action</th>' : ''}</tr></thead>
          <tbody id="fg-equipe-tbody">
            ${equipiers.map((eq, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td><strong>${eq.nom}</strong></td>
                <td>${eq.grade}</td>
                <td>
                  ${canEdit ? `<input type="text" value="${eq.fonction || ''}" onchange="majFonctionEquipier('${enginId}', '${date}', ${idx}, this.value)" style="width:150px; padding:4px 8px;">` : (eq.fonction || '--')}
                </td>
                ${canEdit ? `<td><button class="btn btn-danger btn-sm" onclick="supprimerEquipier('${enginId}', '${date}', ${idx})">✕</button></td>` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${canEdit ? `
          <div class="fg-add-row">
            <select id="fg-new-equipier">${personnelsOptions}</select>
            <input type="text" id="fg-new-fonction" placeholder="Fonction (ex: Chef d'agrès, Pilote...)" style="flex:1; padding:8px 12px; border:1px solid #e2e8f0; border-radius:6px;">
            <button class="btn btn-success btn-sm" onclick="ajouterEquipier('${enginId}', '${date}')">+ Ajouter</button>
          </div>
          <div style="margin-top:15px; display:flex; gap:10px;">
            <button class="btn btn-primary" onclick="validerFeuille('${enginId}', '${date}')">✓ Valider la feuille</button>
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function creerFeuilleGarde() {
  if (!userIsSOG(currentUser)) return showToast("Permission refusée", "error");
  const enginId = document.getElementById('fg-engin-select')?.value;
  const date = document.getElementById('fg-date-select')?.value;
  if (!enginId || !date) return;

  if (!FEUILLES_GARDE[enginId]) FEUILLES_GARDE[enginId] = {};
  if (FEUILLES_GARDE[enginId][date]) return showToast("Feuille déjà existante");

  FEUILLES_GARDE[enginId][date] = {
    enginId, date,
    equipe: [],
    creePar: `${currentUser.lastname} ${currentUser.firstname}`.trim(),
    creeLe: new Date().toISOString(),
    status: 'brouillon'
  };
  sauvegarderDonnees();
  chargerFeuilleGarde();
  showToast("Feuille de garde créée !");
}

function ajouterEquipier(enginId, date) {
  const uid = document.getElementById('fg-new-equipier').value;
  const fonction = document.getElementById('fg-new-fonction').value;
  const p = PERSONNELS.find(x => x.id === uid);
  if (!p) return;

  const feuille = FEUILLES_GARDE[enginId]?.[date];
  if (!feuille) return;
  if (feuille.equipe.find(e => e.id === uid)) return showToast("Déjà ajouté", "error");

  feuille.equipe.push({ id: uid, nom: `${p.nom} ${p.prenom}`, grade: p.grade, fonction });
  sauvegarderDonnees();
  chargerFeuilleGarde();
}

function supprimerEquipier(enginId, date, idx) {
  FEUILLES_GARDE[enginId][date].equipe.splice(idx, 1);
  sauvegarderDonnees();
  chargerFeuilleGarde();
}

function majFonctionEquipier(enginId, date, idx, valeur) {
  FEUILLES_GARDE[enginId][date].equipe[idx].fonction = valeur;
  sauvegarderDonnees();
}

function validerFeuille(enginId, date) {
  FEUILLES_GARDE[enginId][date].status = 'validée';
  sauvegarderDonnees();
  chargerFeuilleGarde();
  showToast("Feuille validée !");
}
