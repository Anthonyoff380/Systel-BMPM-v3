/* ============================================================
   SYSTEL POMPIERS - MODULE INTERVENTIONS SYNOPTIQUE (v17)
   Style: Synoptique Des Interventions (comme image de référence)
   ============================================================ */

function renderInterventionsSynoptique() {
  const container = document.getElementById('interventions-synoptique-container');
  if (!container) return;

  const enCours = INTERVENTIONS.filter(i => i.statut === 'En cours');
  const total = INTERVENTIONS.length;
  const nbEngins = enCours.reduce((acc, i) => acc + (i.engins || []).length, 0);

  let html = `<div class="synop-inter-header">
    <span>${enCours.length} Intervention${enCours.length > 1 ? 's' : ''} en cours • ${nbEngins} Engins engagés</span>
    <a href="cossim.html" class="btn btn-primary btn-sm" style="text-decoration:none;">🚨 OUVRIR COSSIM</a>
  </div>`;

  if (enCours.length === 0) {
    html += `<div class="synop-inter-empty">✅ Aucune intervention en cours</div>`;
  } else {
    html += enCours.map(inter => renderInterventionCard(inter)).join('');
  }

  container.innerHTML = html;
}

function renderInterventionCard(inter) {
  const enginsHTML = (inter.engins || []).map(enginId => {
    const engin = ENGINS.find(e => e.id === enginId);
    if (!engin) return '';
    const ber = engin.berStatut ? BER_STATUTS.find(b => b.code === engin.berStatut) : null;
    const style = ber && ber.couleur ? `background:${ber.couleur}; color:white; border-color:${ber.couleur};` : '';
    return `<div class="synop-engin-box" style="${style}" title="${ber ? ber.label : 'En intervention'}">${engin.nom}</div>`;
  }).join('');

  const servicesHTML = (inter.services || []).map(s => `<span class="synop-service-tag">${s}</span>`).join('');

  const dateFormatted = inter.date ? new Date(inter.date).toLocaleDateString('fr-FR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'}).replace(',', '') : '--';

  return `
    <div class="synop-inter-card">
      <div class="synop-inter-top">
        <div class="synop-inter-toggle" onclick="toggleInterCard('${inter.id}')">▾</div>
        <div class="synop-inter-num"><input type="text" value="${inter.numero || inter.id}" readonly style="width:70px; font-weight:800; text-align:center; border:1px solid #ccc; border-radius:4px; padding:4px; font-size:13px; background:white;"></div>
        <div class="synop-inter-date">${dateFormatted}</div>
        <div class="synop-inter-type">
          <span style="font-size:14px;">🏠</span>
          <strong>${inter.type || 'INTERVENTION'}</strong>
        </div>
        <div class="synop-inter-lieu">${inter.adresse || '--'}</div>
        <div class="synop-inter-obs">${inter.observations || ''}</div>
      </div>
      <div class="synop-inter-details" id="inter-details-${inter.id}" style="display:block;">
        ${servicesHTML ? `<div class="synop-services-row">${servicesHTML}</div>` : ''}
        <div class="synop-engins-row">${enginsHTML || '<span style="color:#999;font-size:12px;">Aucun engin engagé</span>'}</div>
        <div class="synop-inter-actions">
          <button class="synop-action-btn" onclick="terminerIntervention('${inter.id}')" title="Terminer">🔴</button>
          <button class="synop-action-btn" onclick="relancerCOSSIM('${inter.id}')" title="Ouvrir dans COSSIM">🟢</button>
          <button class="synop-action-btn" onclick="bouclierIntervention('${inter.id}')" title="Protection">🛡️</button>
          <button class="synop-action-btn" onclick="infoIntervention('${inter.id}')" title="Info">ℹ️</button>
        </div>
      </div>
    </div>
  `;
}

function toggleInterCard(id) {
  const el = document.getElementById('inter-details-' + id);
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

function terminerIntervention(id) {
  if (!confirm("Terminer cette intervention ?")) return;
  const i = INTERVENTIONS.find(x => x.id === id);
  if (i) {
    i.statut = 'Terminée';
    // Remettre les engins dispo
    (i.engins || []).forEach(eId => {
      const engin = ENGINS.find(e => e.id === eId);
      if (engin) { engin.statut = 'disponible'; engin.berStatut = null; }
    });
    sauvegarderDonnees();
    renderInterventionsSynoptique();
    updateSynoptique();
    showToast("Intervention terminée !");
  }
}

function relancerCOSSIM(id) {
  localStorage.setItem('systel_cossim_inter', id);
  window.open('cossim.html', '_blank');
}
function bouclierIntervention(id) { showToast("Protection activée"); }
function infoIntervention(id) {
  const i = INTERVENTIONS.find(x => x.id === id);
  if (i) alert(`Intervention #${i.id}\nType: ${i.type}\nAdresse: ${i.adresse}\nEngins: ${(i.engins||[]).join(', ')}`);
}

// ===== BER MODAL =====
let berEnginActif = null;
let berInterActif = null;
function ouvrirBER(enginId, intervenionId) {
  const engin = ENGINS.find(e => e.id === enginId);
  if (!engin) return;
  berEnginActif = enginId;
  berInterActif = intervenionId || null;
  document.getElementById('ber-engin-nom').textContent = engin.nom;
  // Mettre à jour les boutons BER
  renderBERStatuts(engin.berStatut);
  ouvrirModal('modal-ber');
}

function renderBERStatuts(actuelCode) {
  const container = document.getElementById('ber-statuts-container');
  container.innerHTML = BER_STATUTS.map(b => `
    <button class="ber-statut-btn ${actuelCode === b.code ? 'ber-active' : ''}" 
      style="background:${b.bg}; color:${b.textColor}; border-color:${b.couleur || '#ccc'}; ${actuelCode === b.code ? 'border-width:3px;' : ''}"
      onclick="changerStatutBER(${b.code})">
      <span class="ber-num">${b.code}</span>
      <span class="ber-label">${b.label}</span>
    </button>
  `).join('');
}

function changerStatutBER(code) {
  const engin = ENGINS.find(e => e.id === berEnginActif);
  if (!engin) return;
  
  if (code === 9) {
    // Fin d'intervention
    engin.berStatut = null;
    engin.statut = 'disponible';
    // Terminer l'intervention associée si nécessaire
  } else {
    engin.berStatut = code;
    engin.statut = 'intervention';
  }
  
  sauvegarderDonnees();
  renderBERStatuts(engin.berStatut);
  renderInterventionsSynoptique();
  updateSynoptique();
  
  const ber = BER_STATUTS.find(b => b.code === code);
  showToast(`${engin.nom} → ${ber.label}`);
}
