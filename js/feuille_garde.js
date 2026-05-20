/* ============================================================
   SYSTEL POMPIERS - FEUILLE DE GARDE (v30)
   SOG/CDG et ADMIN peuvent créer/modifier/supprimer
   ============================================================ */

const POSTES_SPECIAUX = [
  { id:'ms',   label:'Maître de Service',        abrev:'MS'   },
  { id:'sms',  label:'Second Maître de Service', abrev:'SMS'  },
  { id:'gg',   label:'Garde Garage',             abrev:'GG'   },
  { id:'gc',   label:'Garde Cuisine',            abrev:'GC'   },
  { id:'stas', label:'STAS',                     abrev:'STAS' },
  { id:'gs',   label:'Garde Sport',              abrev:'GS'   },
];

function renderFeuilleGarde() {
  const container = document.getElementById('feuille-garde-container');
  if (!container) return;
  const canEdit = userIsSOG(currentUser);
  const today = new Date().toISOString().slice(0,10);
  const gardes = getGardesForDate(today);

  container.innerHTML = `
    <div class="fg-page">
      <div class="fg-toolbar">
        <div class="fg-toolbar-left">
          <div class="fg-select-group">
            <label>DATE</label>
            <input type="date" id="fg-date-select" value="${today}" onchange="reloadFeuilleGarde()">
          </div>
          <div id="fg-info-badge" style="display:flex;align-items:center;gap:8px;"></div>
        </div>
        <div class="fg-toolbar-right">
          ${canEdit ? `<button class="btn btn-primary btn-sm" onclick="ouvrirModalCreerGarde()">+ Créer une garde</button>` : ''}
        </div>
      </div>
      <div id="fg-content"></div>
    </div>`;

  reloadFeuilleGarde();
}

function reloadFeuilleGarde() {
  const date = document.getElementById('fg-date-select')?.value || new Date().toISOString().slice(0,10);
  const canEdit = userIsSOG(currentUser);
  const container = document.getElementById('fg-content');
  if (!container) return;

  // Chercher toutes les gardes pour cette date (format: FEUILLES_GARDE est un objet date->garde)
  const garde = FEUILLES_GARDE[date];

  if (!garde) {
    container.innerHTML = `
      <div class="fg-empty">
        <div style="font-size:48px;margin-bottom:16px;">📋</div>
        <div style="font-weight:800;font-size:15px;color:var(--text-muted);">Aucune feuille de garde pour le ${formatDateFR(date)}</div>
        ${canEdit ? `<button class="btn btn-primary" style="margin-top:16px;" onclick="ouvrirModalCreerGarde()">+ Créer la garde du jour</button>` : '<p style="color:#a0aec0;margin-top:12px;font-size:13px;">Aucune garde créée. Contactez un SOG/CDG.</p>'}
      </div>`;
    return;
  }

  const statutBadge = garde.status === 'validée'
    ? '<span class="badge badge-success">✓ VALIDÉE</span>'
    : '<span class="badge badge-warning">BROUILLON</span>';

  const pOpts = PERSONNELS.map(p => `<option value="${p.id}">${p.nom} ${p.prenom} (${p.grade})</option>`).join('');

  // Postes spéciaux
  const postesHTML = POSTES_SPECIAUX.map(poste => {
    const uid = garde.postesSpeciaux?.[poste.id];
    const person = uid ? PERSONNELS.find(p => p.id === uid) : null;
    return `<div class="fg-poste-item">
      <div class="fg-poste-abrev">${poste.abrev}</div>
      <div class="fg-poste-label">${poste.label}</div>
      ${canEdit
        ? `<select class="fg-poste-select" onchange="assignerPosteSpecial('${date}','${poste.id}',this.value)">
            <option value="">-- Non assigné --</option>
            ${PERSONNELS.map(p=>`<option value="${p.id}" ${uid===p.id?'selected':''}>${p.nom} ${p.prenom}</option>`).join('')}
          </select>`
        : `<div class="fg-poste-assigned">${person ? person.nom+' '+person.prenom : '—'}</div>`}
    </div>`;
  }).join('');

  // Grille des engins (style image 4)
  const enginsGrille = (garde.engins || []).map(enginData => {
    const engin = ENGINS.find(e => e.id === enginData.id);
    const nom = enginData.nom || engin?.nom || enginData.id;
    const postes = enginData.postes || [];
    return `<div class="fg-engin-card">
      <div class="fg-engin-title">${nom}</div>
      ${postes.map((p, pi) => {
        const person = p.userId ? PERSONNELS.find(x => x.id === p.userId) : null;
        return `<div class="fg-engin-row">
          <span class="fg-engin-poste-abrev">${p.abrev}</span>
          ${canEdit
            ? `<select class="fg-engin-select" onchange="majPosteEnginGarde('${date}','${enginData.id}',${pi},this.value)">
                <option value="">—</option>
                ${PERSONNELS.map(x=>`<option value="${x.id}" ${p.userId===x.id?'selected':''}>${x.nom} ${x.prenom}</option>`).join('')}
              </select>`
            : `<span class="fg-engin-person">${person ? person.nom+' '+person.prenom : '—'}</span>`}
        </div>`;
      }).join('')}
      ${canEdit ? `<button class="btn btn-danger btn-sm" style="margin-top:6px;font-size:10px;padding:2px 8px;" onclick="supprimerEnginGarde('${date}','${enginData.id}')">✕ Retirer</button>` : ''}
    </div>`;
  }).join('');

  container.innerHTML = `
    <div class="fg-card">
      <div class="fg-doc-header">
        <div>
          <div class="fg-doc-title">FEUILLE DE GARDE — ${formatDateFR(date)}</div>
          <div class="fg-doc-meta">Créée par : <strong>${garde.creePar||'--'}</strong> &bull; Le : <strong>${garde.creeLe ? new Date(garde.creeLe).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '--'}</strong></div>
        </div>
        <div style="display:flex;gap:8px;align-items:center;">
          ${statutBadge}
          ${canEdit ? `<button class="btn btn-danger btn-sm" onclick="supprimerGarde('${date}')">🗑️ Supprimer</button>` : ''}
        </div>
      </div>

      <!-- Description -->
      <div class="fg-section">
        <div class="fg-section-title">📝 Description / Consignes</div>
        <div class="fg-section-body">
          ${canEdit
            ? `<textarea id="fg-desc" rows="3" class="fg-textarea" placeholder="Consignes, infos particulières..." onchange="majDescriptionGarde('${date}',this.value)">${garde.description||''}</textarea>`
            : `<div class="fg-desc-view">${garde.description||'<em style="color:#718096;">Aucune description</em>'}</div>`}
        </div>
      </div>

      <!-- Postes spéciaux -->
      <div class="fg-section">
        <div class="fg-section-title">🏅 Postes de service</div>
        <div class="fg-section-body">
          <div class="fg-postes-grid">${postesHTML}</div>
        </div>
      </div>

      <!-- Engins — grille -->
      <div class="fg-section">
        <div class="fg-section-title" style="display:flex;justify-content:space-between;align-items:center;">
          <span>🚒 Armement des engins</span>
          ${canEdit ? `<button class="btn btn-success btn-sm" onclick="ajouterEnginGarde('${date}')">+ Ajouter un engin</button>` : ''}
        </div>
        <div class="fg-section-body">
          <div class="fg-engins-grille">${enginsGrille || '<div style="color:var(--text-muted);font-size:13px;font-style:italic;">Aucun engin ajouté — cliquez sur "+ Ajouter un engin"</div>'}</div>
        </div>
      </div>

      <!-- Actions -->
      ${canEdit ? `
        <div class="fg-actions">
          ${garde.status !== 'validée'
            ? `<button class="btn btn-primary" onclick="validerGarde('${date}')">✓ Valider</button>`
            : `<button class="btn btn-secondary" onclick="deverrouillerGarde('${date}')">🔓 Déverrouiller</button>`}
          <button class="btn btn-secondary" onclick="imprimerGarde('${date}')">🖨️ Imprimer</button>
        </div>` : ''}
    </div>`;
}

function formatDateFR(d) {
  return new Date(d+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'2-digit',month:'long',year:'numeric'});
}
function getGardesForDate(date) {
  return FEUILLES_GARDE[date] ? [FEUILLES_GARDE[date]] : [];
}

// ===== MODAL CRÉER GARDE =====
function ouvrirModalCreerGarde() {
  const date = document.getElementById('fg-date-select')?.value || new Date().toISOString().slice(0,10);
  if (FEUILLES_GARDE[date]) {
    if (!confirm(`Une garde existe déjà pour le ${formatDateFR(date)}. Voulez-vous la réinitialiser ?`)) return;
  }
  const enginsOpts = ENGINS.map(e => `<option value="${e.id}">${e.nom}</option>`).join('');
  // Ouvrir un modal simple
  const existingModal = document.getElementById('fg-create-modal');
  if (existingModal) existingModal.remove();
  const modal = document.createElement('div');
  modal.id = 'fg-create-modal';
  modal.style.cssText = 'position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;';
  modal.innerHTML = `
    <div style="background:var(--card-bg);border-radius:12px;padding:28px 32px;min-width:400px;max-width:520px;border:1px solid var(--border-color);">
      <h3 style="margin-bottom:16px;font-size:16px;font-weight:900;">📋 Créer la garde du ${formatDateFR(date)}</h3>
      <div style="margin-bottom:14px;">
        <label style="font-size:11px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:5px;text-transform:uppercase;">Type de garde</label>
        <select id="fg-type-garde" style="width:100%;padding:8px 10px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-main);color:var(--text-color);">
          <option>GARDE JOUR</option><option>GARDE NUIT</option><option>GARDE 24H</option>
        </select>
      </div>
      <div style="margin-bottom:14px;">
        <label style="font-size:11px;font-weight:700;color:var(--text-muted);display:block;margin-bottom:5px;text-transform:uppercase;">Engins à inclure</label>
        <select id="fg-engins-sel" multiple style="width:100%;height:120px;padding:6px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-main);color:var(--text-color);">
          ${enginsOpts}
        </select>
        <div style="font-size:10px;color:var(--text-muted);margin-top:3px;">Ctrl+clic pour sélectionner plusieurs engins</div>
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end;margin-top:18px;">
        <button class="btn btn-secondary" onclick="document.getElementById('fg-create-modal').remove()">Annuler</button>
        <button class="btn btn-primary" onclick="confirmerCreerGarde('${date}')">✓ Créer</button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

function confirmerCreerGarde(date) {
  const type = document.getElementById('fg-type-garde')?.value || 'GARDE JOUR';
  const sel = document.getElementById('fg-engins-sel');
  const enginsSelIds = sel ? Array.from(sel.selectedOptions).map(o => o.value) : ENGINS.map(e => e.id);

  const engins = enginsSelIds.map(enginId => {
    const engin = ENGINS.find(e => e.id === enginId);
    const postes = (engin?.postes || [{id:'ca',label:"Chef d'agrès",abrev:'C/A'},{id:'eq1',label:'Équipier',abrev:'EQ'}]);
    return {
      id: enginId,
      nom: engin?.nom || enginId,
      postes: postes.map(p => ({...p, userId: null}))
    };
  });

  FEUILLES_GARDE[date] = {
    date, type,
    engins,
    postesSpeciaux: {},
    description: '',
    creePar: `${currentUser.lastname||''} ${currentUser.firstname||''}`.trim() || currentUser.id,
    creeLe: new Date().toISOString(),
    status: 'brouillon'
  };

  document.getElementById('fg-create-modal')?.remove();
  sauvegarderDonnees();
  reloadFeuilleGarde();
  showToast('Feuille de garde créée !');
}

function supprimerGarde(date) {
  if (!confirm(`Supprimer la feuille de garde du ${formatDateFR(date)} ?`)) return;
  delete FEUILLES_GARDE[date];
  sauvegarderDonnees();
  reloadFeuilleGarde();
  showToast('Feuille supprimée');
}

function ajouterEnginGarde(date) {
  const garde = FEUILLES_GARDE[date];
  if (!garde) return;
  const enginsOpts = ENGINS.filter(e => !garde.engins?.find(g => g.id === e.id))
    .map(e => `<option value="${e.id}">${e.nom}</option>`).join('');
  if (!enginsOpts) return showToast('Tous les engins sont déjà ajoutés');
  const sel = document.createElement('select');
  sel.innerHTML = enginsOpts;
  document.body.appendChild(sel);
  // Modal rapide
  const enginId = prompt('Nom de l\'engin :\n' + ENGINS.filter(e => !garde.engins?.find(g=>g.id===e.id)).map(e=>e.nom).join('\n'));
  document.body.removeChild(sel);
  const engin = ENGINS.find(e => e.nom === enginId || e.id === enginId);
  if (!engin) return showToast('Engin non trouvé', 'error');
  const postes = (engin.postes || [{id:'ca',label:"Chef d'agrès",abrev:'C/A'}]).map(p => ({...p, userId: null}));
  if (!garde.engins) garde.engins = [];
  garde.engins.push({ id: engin.id, nom: engin.nom, postes });
  sauvegarderDonnees();
  reloadFeuilleGarde();
}

function supprimerEnginGarde(date, enginId) {
  const garde = FEUILLES_GARDE[date];
  if (!garde?.engins) return;
  garde.engins = garde.engins.filter(e => e.id !== enginId);
  sauvegarderDonnees();
  reloadFeuilleGarde();
}

function majPosteEnginGarde(date, enginId, posteIdx, userId) {
  const garde = FEUILLES_GARDE[date];
  const enginData = garde?.engins?.find(e => e.id === enginId);
  if (!enginData?.postes?.[posteIdx]) return;
  enginData.postes[posteIdx].userId = userId || null;
  // Sauvegarde directe Firestore sans déclencher le listener local
  if (typeof fbSaveFeuille === 'function') {
    fbSaveFeuille(date, garde).catch(e => console.warn('Erreur save feuille:', e));
  }
}

function assignerPosteSpecial(date, posteId, userId) {
  const garde = FEUILLES_GARDE[date];
  if (!garde) return;
  if (!garde.postesSpeciaux) garde.postesSpeciaux = {};
  if (userId) garde.postesSpeciaux[posteId] = userId;
  else delete garde.postesSpeciaux[posteId];
  // Sauvegarde directe Firestore sans déclencher le listener local
  if (typeof fbSaveFeuille === 'function') {
    fbSaveFeuille(date, garde).catch(e => console.warn('Erreur save feuille:', e));
  }
  showToast('Poste mis à jour');
}

function majDescriptionGarde(date, val) {
  if (!FEUILLES_GARDE[date]) return;
  FEUILLES_GARDE[date].description = val;
  if (typeof fbSaveFeuille === 'function') {
    fbSaveFeuille(date, FEUILLES_GARDE[date]).catch(e => console.warn('Erreur save feuille:', e));
  }
}
function validerGarde(date) {
  FEUILLES_GARDE[date].status = 'validée'; sauvegarderDonnees(); reloadFeuilleGarde(); showToast('Garde validée !');
}
function deverrouillerGarde(date) {
  FEUILLES_GARDE[date].status = 'brouillon'; sauvegarderDonnees(); reloadFeuilleGarde();
}

function imprimerGarde(date) {
  const garde = FEUILLES_GARDE[date];
  if (!garde) return;
  const win = window.open('','_blank');
  const postesRows = POSTES_SPECIAUX.map(p => {
    const uid = garde.postesSpeciaux?.[p.id];
    const person = uid ? PERSONNELS.find(x => x.id === uid) : null;
    return `<tr><td><strong>${p.abrev}</strong></td><td>${p.label}</td><td>${person ? person.nom+' '+person.prenom : '—'}</td></tr>`;
  }).join('');
  const enginsHTML = (garde.engins||[]).map(ed => {
    const rows = (ed.postes||[]).map(p => {
      const person = p.userId ? PERSONNELS.find(x=>x.id===p.userId) : null;
      return `<tr><td><strong>${p.abrev}</strong></td><td>${person ? person.nom+' '+person.prenom : '—'}</td></tr>`;
    }).join('');
    return `<div class="engin-block"><div class="engin-title">${ed.nom}</div><table>${rows}</table></div>`;
  }).join('');
  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Feuille de garde</title>
  <style>
  *{box-sizing:border-box;}body{font-family:Arial,sans-serif;margin:12mm 15mm;font-size:10pt;}
  h1{font-size:14pt;border-bottom:2px solid #000;padding-bottom:5px;margin-bottom:4px;}
  .meta{font-size:9pt;color:#555;margin-bottom:12px;}
  h2{font-size:10pt;background:#000;color:#fff;padding:2px 8px;margin:12px 0 6px;}
  table{border-collapse:collapse;font-size:9.5pt;}td,th{border:1px solid #ccc;padding:3px 7px;}
  .engins-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:6px;}
  .engin-block{border:1.5px solid #000;border-radius:3px;overflow:hidden;}
  .engin-title{background:#222;color:#fff;font-weight:700;padding:3px 8px;font-size:9.5pt;text-align:center;}
  .engin-block table{width:100%;font-size:9pt;}
  .engin-block td{border-color:#ddd;}
  </style></head><body>
  <h1>Feuille de garde — ${formatDateFR(date)}</h1>
  <div class="meta">Type: <strong>${garde.type||'--'}</strong> • Créée par: <strong>${garde.creePar||'--'}</strong> • Statut: <strong>${garde.status||'brouillon'}</strong></div>
  ${garde.description ? `<div style="border:1px solid #ccc;padding:6px;margin-bottom:10px;font-size:9.5pt;">${garde.description}</div>` : ''}
  <h2>POSTES DE SERVICE</h2>
  <table><thead><tr><th>Abrev</th><th>Poste</th><th>Assigné à</th></tr></thead><tbody>${postesRows}</tbody></table>
  <h2>ARMEMENT DES VÉHICULES</h2>
  <div class="engins-grid">${enginsHTML}</div>
  <script>window.print();<\/script></body></html>`);
  win.document.close();
}
