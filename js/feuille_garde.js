/* ============================================================
   SYSTEL POMPIERS - MODULE FEUILLE DE GARDE (v20)
   Créable par SOG/CDG et ADMIN
   Postes spéciaux: MS, SMS, GG, GC, STAS, GS
   ============================================================ */

const POSTES_SPECIAUX = [
  { id: 'ms',   label: 'Maître de Service',         abrev: 'MS'   },
  { id: 'sms',  label: 'Second Maître de Service',  abrev: 'SMS'  },
  { id: 'gg',   label: 'Garde Garage',              abrev: 'GG'   },
  { id: 'gc',   label: 'Garde Cuisine',             abrev: 'GC'   },
  { id: 'stas', label: 'STAS',                      abrev: 'STAS' },
  { id: 'gs',   label: 'Garde Sport',               abrev: 'GS'   },
];

function renderFeuilleGarde() {
  const container = document.getElementById('feuille-garde-container');
  if (!container) return;
  const canEdit = userIsSOG(currentUser);
  const today = new Date().toISOString().slice(0,10);

  container.innerHTML = `
    <div class="fg-page">
      <!-- TOOLBAR -->
      <div class="fg-toolbar">
        <div class="fg-toolbar-left">
          <div class="fg-select-group">
            <label>Engin</label>
            <select id="fg-engin-select" onchange="chargerFeuilleGarde()">${ENGINS.map(e=>`<option value="${e.id}">${e.nom}</option>`).join('')}</select>
          </div>
          <div class="fg-select-group">
            <label>Date</label>
            <input type="date" id="fg-date-select" value="${today}" onchange="chargerFeuilleGarde()">
          </div>
        </div>
        <div class="fg-toolbar-right">
          ${canEdit ? `<button class="btn btn-primary btn-sm" onclick="creerFeuilleGarde()">+ Créer la garde</button>` : ''}
        </div>
      </div>
      <!-- CONTENU -->
      <div id="fg-content"></div>
    </div>`;

  chargerFeuilleGarde();
}

function chargerFeuilleGarde() {
  const enginId = document.getElementById('fg-engin-select')?.value;
  const date    = document.getElementById('fg-date-select')?.value;
  if (!enginId || !date) return;
  const engin   = ENGINS.find(e => e.id === enginId);
  const feuille = FEUILLES_GARDE[enginId]?.[date];
  const container = document.getElementById('fg-content');
  const canEdit = userIsSOG(currentUser);

  if (!feuille) {
    container.innerHTML = `
      <div class="fg-empty">
        <div style="font-size:52px;margin-bottom:14px;">📋</div>
        <div style="font-weight:800;font-size:15px;color:var(--text-muted);">Aucune feuille de garde pour <strong>${engin?.nom}</strong> le ${date}</div>
        ${canEdit
          ? `<button class="btn btn-primary" style="margin-top:16px;" onclick="creerFeuilleGarde()">+ Créer la feuille de garde</button>`
          : `<p style="color:#a0aec0;margin-top:12px;font-size:13px;">Contactez un SOG/CDG ou un administrateur.</p>`}
      </div>`;
    return;
  }

  const pOpts = PERSONNELS.map(p => `<option value="${p.id}">${p.nom} ${p.prenom} (${p.grade})</option>`).join('');
  const postesEngin = (engin?.postes || [{id:'ca',label:"Chef d'agrès",abrev:'C/A'}]);
  const fonctionsOpts = [
    ...postesEngin.map(p => `<option value="${p.label}">${p.abrev} — ${p.label}</option>`),
    ...POSTES_SPECIAUX.map(p => `<option value="${p.label}">${p.abrev} — ${p.label}</option>`),
    `<option value="">— Autre —</option>`
  ].join('');

  const statutBadge = feuille.status === 'validée'
    ? '<span class="badge badge-success">✓ VALIDÉE</span>'
    : '<span class="badge badge-warning">BROUILLON</span>';

  container.innerHTML = `
    <div class="fg-card">

      <!-- EN-TÊTE DOCUMENT -->
      <div class="fg-doc-header">
        <div class="fg-doc-left">
          <div class="fg-doc-title">FEUILLE DE GARDE — ${engin?.nom || enginId}</div>
          <div class="fg-doc-meta">
            Date : <strong>${formatDateFR(date)}</strong>
            &nbsp;•&nbsp; Créée par : <strong>${feuille.creePar || '--'}</strong>
            &nbsp;•&nbsp; Le : <strong>${feuille.creeLe ? new Date(feuille.creeLe).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '--'}</strong>
          </div>
        </div>
        <div>${statutBadge}</div>
      </div>

      <!-- DESCRIPTION GARDE -->
      <div class="fg-section">
        <div class="fg-section-title">📝 Description / Consignes particulières</div>
        <div class="fg-section-body">
          ${canEdit
            ? `<textarea id="fg-desc" rows="3" class="fg-textarea" placeholder="Consignes, infos spécifiques à cette garde..."
                onchange="majDescription('${enginId}','${date}',this.value)">${feuille.description||''}</textarea>`
            : `<div class="fg-desc-view">${feuille.description || '<em style="color:#718096;">Aucune description</em>'}</div>`}
        </div>
      </div>

      <!-- POSTES SPÉCIAUX -->
      <div class="fg-section">
        <div class="fg-section-title">🏅 Postes de service</div>
        <div class="fg-section-body">
          <div class="fg-postes-grid">
            ${POSTES_SPECIAUX.map(poste => {
              const assigned = feuille.postesSpeciaux?.[poste.id];
              const person = assigned ? PERSONNELS.find(p => p.id === assigned) : null;
              return `<div class="fg-poste-item">
                <div class="fg-poste-abrev">${poste.abrev}</div>
                <div class="fg-poste-label">${poste.label}</div>
                ${canEdit
                  ? `<select class="fg-poste-select" onchange="assignerPosteSpecial('${enginId}','${date}','${poste.id}',this.value)">
                      <option value="">-- Non assigné --</option>
                      ${PERSONNELS.map(p => `<option value="${p.id}" ${assigned===p.id?'selected':''}>${p.nom} ${p.prenom}</option>`).join('')}
                    </select>`
                  : `<div class="fg-poste-assigned">${person ? person.nom+' '+person.prenom : '<em>—</em>'}</div>`}
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <!-- ÉQUIPAGE -->
      <div class="fg-section">
        <div class="fg-section-title">🚒 Équipage de l'engin</div>
        <div class="fg-section-body">
          <table class="fg-table">
            <thead>
              <tr><th>#</th><th>Nom</th><th>Grade</th><th>Fonction / Poste</th>${canEdit?'<th></th>':''}</tr>
            </thead>
            <tbody>
              ${(feuille.equipe||[]).map((eq,idx) => `
                <tr>
                  <td class="fg-td-num">${idx+1}</td>
                  <td><strong>${eq.nom}</strong></td>
                  <td><span class="fg-grade-badge">${eq.grade}</span></td>
                  <td>${canEdit
                    ? `<input type="text" value="${eq.fonction||''}" list="fg-fonctions-list-${enginId}" 
                        onchange="majFonctionEquipier('${enginId}','${date}',${idx},this.value)"
                        style="width:100%;padding:4px 8px;border:1px solid var(--border-color);border-radius:4px;background:var(--bg-main);color:var(--text-color);">`
                    : (eq.fonction||'—')}</td>
                  ${canEdit?`<td><button class="btn btn-danger btn-sm" onclick="supprimerEquipier('${enginId}','${date}',${idx})">✕</button></td>`:''}
                </tr>`).join('')}
            </tbody>
          </table>
          <datalist id="fg-fonctions-list-${enginId}">
            ${postesEngin.map(p=>`<option value="${p.label}">`).join('')}
            ${POSTES_SPECIAUX.map(p=>`<option value="${p.label}">`).join('')}
          </datalist>

          ${canEdit ? `
            <div class="fg-add-row">
              <select id="fg-new-equipier-${enginId}" style="flex:2;">${pOpts}</select>
              <input type="text" id="fg-new-fonction-${enginId}" list="fg-fonctions-list-${enginId}"
                placeholder="Fonction (C/A, EQ1, MS...)" style="flex:2;padding:8px 12px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-main);color:var(--text-color);">
              <button class="btn btn-success btn-sm" onclick="ajouterEquipier('${enginId}','${date}')">+ Ajouter</button>
            </div>` : ''}
        </div>
      </div>

      <!-- ACTIONS -->
      ${canEdit ? `
        <div class="fg-actions">
          ${feuille.status !== 'validée'
            ? `<button class="btn btn-primary" onclick="validerFeuille('${enginId}','${date}')">✓ Valider la feuille</button>`
            : `<button class="btn btn-secondary" onclick="deverrouillerFeuille('${enginId}','${date}')">🔓 Déverrouiller</button>`}
          <button class="btn btn-secondary" onclick="imprimerFeuille('${enginId}','${date}')">🖨️ Imprimer</button>
        </div>` : ''}
    </div>`;
}

function formatDateFR(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', {weekday:'long',day:'2-digit',month:'long',year:'numeric'});
}

function creerFeuilleGarde() {
  if (!userIsSOG(currentUser)) return showToast("Permission refusée — SOG/CDG requis","error");
  const enginId = document.getElementById('fg-engin-select')?.value;
  const date    = document.getElementById('fg-date-select')?.value;
  if (!enginId || !date) return;
  if (!FEUILLES_GARDE[enginId]) FEUILLES_GARDE[enginId] = {};
  if (FEUILLES_GARDE[enginId][date]) return showToast("Feuille déjà existante pour cette date");
  FEUILLES_GARDE[enginId][date] = {
    enginId, date, equipe: [], postesSpeciaux: {}, description: '',
    creePar: `${currentUser.lastname||''} ${currentUser.firstname||''}`.trim() || currentUser.id,
    creeLe: new Date().toISOString(), status: 'brouillon'
  };
  sauvegarderDonnees();
  chargerFeuilleGarde();
  showToast("Feuille de garde créée !");
}

function ajouterEquipier(enginId, date) {
  const uid  = document.getElementById('fg-new-equipier-' + enginId)?.value;
  const fonc = document.getElementById('fg-new-fonction-' + enginId)?.value || '';
  const p = PERSONNELS.find(x => x.id === uid);
  if (!p) return;
  const feuille = FEUILLES_GARDE[enginId]?.[date];
  if (!feuille) return;
  if (feuille.equipe.find(e => e.id === uid)) return showToast("Déjà ajouté","error");
  feuille.equipe.push({id:uid, nom:`${p.nom} ${p.prenom}`, grade:p.grade, fonction:fonc});
  sauvegarderDonnees();
  chargerFeuilleGarde();
}

function supprimerEquipier(enginId, date, idx) {
  FEUILLES_GARDE[enginId][date].equipe.splice(idx,1);
  sauvegarderDonnees();
  chargerFeuilleGarde();
}

function majFonctionEquipier(enginId, date, idx, valeur) {
  if (FEUILLES_GARDE[enginId]?.[date]?.equipe[idx])
    FEUILLES_GARDE[enginId][date].equipe[idx].fonction = valeur;
  sauvegarderDonnees();
}

function majDescription(enginId, date, valeur) {
  if (FEUILLES_GARDE[enginId]?.[date])
    FEUILLES_GARDE[enginId][date].description = valeur;
  sauvegarderDonnees();
}

function assignerPosteSpecial(enginId, date, posteId, userId) {
  if (!FEUILLES_GARDE[enginId]?.[date]) return;
  if (!FEUILLES_GARDE[enginId][date].postesSpeciaux)
    FEUILLES_GARDE[enginId][date].postesSpeciaux = {};
  if (userId) FEUILLES_GARDE[enginId][date].postesSpeciaux[posteId] = userId;
  else delete FEUILLES_GARDE[enginId][date].postesSpeciaux[posteId];
  sauvegarderDonnees();
  showToast("Poste mis à jour");
}

function validerFeuille(enginId, date) {
  FEUILLES_GARDE[enginId][date].status = 'validée';
  sauvegarderDonnees();
  chargerFeuilleGarde();
  showToast("Feuille validée !");
}

function deverrouillerFeuille(enginId, date) {
  FEUILLES_GARDE[enginId][date].status = 'brouillon';
  sauvegarderDonnees();
  chargerFeuilleGarde();
}

function imprimerFeuille(enginId, date) {
  const engin   = ENGINS.find(e => e.id === enginId);
  const feuille = FEUILLES_GARDE[enginId]?.[date];
  if (!feuille) return;
  const win = window.open('','_blank');
  const equipeRows = (feuille.equipe||[]).map((eq,i) =>
    `<tr><td>${i+1}</td><td><strong>${eq.nom}</strong></td><td>${eq.grade}</td><td>${eq.fonction||'—'}</td></tr>`
  ).join('');
  const postesRows = POSTES_SPECIAUX.map(p => {
    const uid = feuille.postesSpeciaux?.[p.id];
    const person = uid ? PERSONNELS.find(x => x.id === uid) : null;
    return `<tr><td><strong>${p.abrev}</strong></td><td>${p.label}</td><td>${person?person.nom+' '+person.prenom:'—'}</td></tr>`;
  }).join('');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Feuille de garde</title>
  <style>body{font-family:'Times New Roman',Times,serif;margin:15mm 20mm;color:#000;}
  h1{font-size:16pt;text-align:center;border-bottom:2px solid #000;padding-bottom:6px;}
  h2{font-size:11pt;background:#000;color:#fff;padding:3px 8px;margin:14px 0 6px;}
  table{width:100%;border-collapse:collapse;}th,td{border:1px solid #ccc;padding:5px 8px;font-size:10pt;}
  th{background:#f0f0f0;font-weight:700;text-align:left;}.meta{font-size:10pt;margin-bottom:10px;line-height:1.8;}
  .desc{border:1px solid #ccc;padding:8px;min-height:20mm;font-size:10pt;margin-bottom:8px;}
  </style></head><body>
  <h1>FEUILLE DE GARDE — ${engin?.nom||enginId}</h1>
  <div class="meta">
    <strong>Date :</strong> ${formatDateFR(date)}<br>
    <strong>Créée par :</strong> ${feuille.creePar||'--'}<br>
    <strong>Statut :</strong> ${feuille.status||'brouillon'}
  </div>
  <h2>DESCRIPTION / CONSIGNES</h2>
  <div class="desc">${feuille.description||'—'}</div>
  <h2>POSTES DE SERVICE</h2>
  <table><thead><tr><th>Abrev</th><th>Poste</th><th>Assigné à</th></tr></thead><tbody>${postesRows}</tbody></table>
  <h2>ÉQUIPAGE</h2>
  <table><thead><tr><th>#</th><th>Nom</th><th>Grade</th><th>Fonction</th></tr></thead><tbody>${equipeRows}</tbody></table>
  <script>window.print();<\/script></body></html>`);
  win.document.close();
}
