function userPeutTerminer() { return typeof currentUser !== "undefined" && userHasCOSSIM(currentUser); }

/* ============================================================
   SYSTEL POMPIERS - MODULE INTERVENTIONS SYNOPTIQUE (v18)
   ============================================================ */

function renderInterventionsSynoptique() {
  const container = document.getElementById('interventions-synoptique-container');
  if (!container) return;
  const enCours = INTERVENTIONS.filter(i => i.statut === 'En cours');
  const nbEngins = enCours.reduce((acc,i) => acc + (i.engins||[]).length, 0);
  let html = `<div class="synop-inter-header">
    <span>${enCours.length} Intervention${enCours.length>1?'s':''} en cours &bull; ${nbEngins} Engins engagés</span>
    ${(typeof currentUser !== "undefined" && userHasCOSSIM(currentUser)) ? '<a href="cossim.html" class="btn btn-primary btn-sm" style="text-decoration:none;">🚨 OUVRIR COSSIM</a>' : ""}
  </div>`;
  if (enCours.length === 0) {
    html += `<div class="synop-inter-empty">✅ Aucune intervention en cours</div>`;
  } else {
    html += enCours.map(inter => renderInterventionCard(inter)).join('');
  }
  container.innerHTML = html;
}

function renderInterventionCard(inter) {
  const enginsHTML = (inter.engins||[]).map(enginId => {
    const engin = ENGINS.find(e => e.id === enginId);
    if (!engin) return '';
    const ber = engin.berStatut ? BER_STATUTS.find(b => b.code === engin.berStatut) : null;
    const style = ber && ber.couleur ? `background:${ber.couleur};color:white;border-color:${ber.couleur};` : '';
    const label = ber ? `${ber.code} – ${ber.label}` : 'En intervention';
    return `<div class="synop-engin-box" style="${style}" title="${label}"
      onclick="ouvrirBER('${engin.id}')">${engin.nom}${ber?` <sup>${ber.code}</sup>`:''}</div>`;
  }).join('');
  const servicesHTML = (inter.services||[]).map(s => `<span class="synop-service-tag">${s}</span>`).join('');
  const dateFormatted = inter.date ? new Date(inter.date).toLocaleString('fr-FR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'}) : '--';
  return `
    <div class="synop-inter-card">
      <div class="synop-inter-top" onclick="toggleInterCard('${inter.id}')">
        <div class="synop-inter-toggle" id="toggle-${inter.id}">▾</div>
        <div class="synop-inter-num"><span style="font-weight:900;color:var(--accent);font-size:16px;">#${inter.numero||inter.id}</span></div>
        <div class="synop-inter-date">${dateFormatted}</div>
        <div class="synop-inter-type"><strong>${inter.type||'INTERVENTION'}</strong></div>
        <div class="synop-inter-lieu">${inter.adresse||'--'}</div>
        <div class="synop-inter-obs">${inter.observations||''}</div>
      </div>
      <div class="synop-inter-details" id="inter-details-${inter.id}">
        ${servicesHTML ? `<div class="synop-services-row">${servicesHTML}</div>` : ''}
        <div class="synop-engins-row">${enginsHTML||'<span style="color:#999;font-size:12px;">Aucun engin engagé</span>'}</div>
        <div class="synop-inter-actions">
          ${userPeutTerminer() ? '<button class="synop-action-btn" onclick="terminerIntervention(\''+inter.id+'\')" title="Terminer">🔴</button>' : ''}
          <button class="synop-action-btn" onclick="relancerCOSSIM('${inter.id}')" title="Ouvrir COSSIM">🟢</button>
          <button class="synop-action-btn" onclick="infoIntervention('${inter.id}')" title="Info">ℹ️</button>
        </div>
      </div>
    </div>`;
}

function toggleInterCard(id) {
  const el = document.getElementById('inter-details-'+id);
  const tog = document.getElementById('toggle-'+id);
  if (!el) return;
  const open = el.style.display !== 'none';
  el.style.display = open ? 'none' : 'block';
  if (tog) tog.textContent = open ? '▸' : '▾';
}

function terminerIntervention(id) {
  if (!confirm("Terminer cette intervention ?")) return;
  // Trouver et mettre à jour le statut
  const idx = INTERVENTIONS.findIndex(x => x.id === id);
  if (idx === -1) return;
  const inter = INTERVENTIONS[idx];
  inter.statut = 'Terminée';
  inter.dateFin = new Date().toISOString();
  // Remettre tous les engins engagés en disponible
  (inter.engins || []).forEach(eId => {
    const engin = ENGINS.find(e => e.id === eId);
    if (engin) {
      engin.statut = 'disponible';
      engin.berStatut = null;
      engin.chefAgres = null;
    }
  });
  sauvegarderDonnees();
  // Forcer re-render complet
  renderInterventionsSynoptique();
  if (typeof updateSynoptique === 'function') updateSynoptique();
  showToast("Intervention #" + id + " terminée !");
}
function relancerCOSSIM(id) { localStorage.setItem('systel_cossim_inter', id); window.open('cossim.html','_blank'); }
function infoIntervention(id) {
  const i = INTERVENTIONS.find(x => x.id === id);
  if (i) alert(`Intervention #${i.id}\nType: ${i.type}\nAdresse: ${i.adresse}\nEngins: ${(i.engins||[]).join(', ')}`);
}

// ===== BER MODAL IMAGE =====
let berEnginActif = null;
function ouvrirBER(enginId) {
  const engin = ENGINS.find(e => e.id === enginId);
  if (!engin) return;
  berEnginActif = enginId;
  document.getElementById('ber-engin-nom').textContent = engin.nom;
  // Reset tous les boutons
  for (let i = 1; i <= 9; i++) {
    const btn = document.getElementById('ber-btn-' + i);
    if (btn) btn.classList.remove('ber-active-btn');
  }
  // Activer le statut en cours
  if (engin.berStatut) {
    const activeBtn = document.getElementById('ber-btn-' + engin.berStatut);
    if (activeBtn) activeBtn.classList.add('ber-active-btn');
    const ber = BER_STATUTS.find(b => b.code === engin.berStatut);
    // Mettre à jour l'écran LCD
  const lcd2 = document.getElementById('ber-lcd-statut');
  const lcdE = document.getElementById('ber-lcd-engin');
  const lcdC = document.getElementById('ber-lcd-code');
  if (lcd2) lcd2.textContent = ber ? ber.label : 'En attente';
  if (lcdE) lcdE.textContent = engin.nom;
  if (lcdC) { lcdC.textContent = ber ? ber.code : ''; lcdC.style.color = ber?.couleur || '#0a2a10'; }
  } else {
    const lbl = document.getElementById('ber-active-label');
    if (lbl) lbl.style.display = 'none';
  }
  ouvrirModal('modal-ber');
}

function renderBERStatuts(actuelCode) {} // conservé pour compatibilité

function changerStatutBER(code) {
  const engin = ENGINS.find(e => e.id === berEnginActif);
  if (!engin) return;
  if (code === 9) {
    engin.berStatut = null;
    engin.statut = 'disponible';
  } else {
    engin.berStatut = code;
    engin.statut = 'intervention';
  }
  sauvegarderDonnees();
  // Reset tous les boutons
  for (let i = 1; i <= 9; i++) {
    const btn = document.getElementById('ber-btn-' + i);
    if (btn) btn.classList.remove('ber-active-btn');
  }
  // Activer le bouton cliqué
  const activeBtn = document.getElementById('ber-btn-' + code);
  if (activeBtn) activeBtn.classList.add('ber-active-btn');
  // Mettre à jour l'écran LCD de la radio
  const ber = BER_STATUTS.find(b => b.code === code);
  const lcd = document.getElementById('ber-lcd-statut');
  const lcdEngin = document.getElementById('ber-lcd-engin');
  const lcdCode = document.getElementById('ber-lcd-code');
  if (lcd) lcd.textContent = ber ? ber.label : '--';
  if (lcdEngin) lcdEngin.textContent = engin.nom;
  if (lcdCode) { lcdCode.textContent = ber ? ber.code : ''; lcdCode.style.color = ber?.couleur || '#0a2a10'; }
  renderInterventionsSynoptique();
  if (typeof updateSynoptique === 'function') updateSynoptique();
  showToast(engin.nom + ' → ' + (ber ? ber.label : code));
}