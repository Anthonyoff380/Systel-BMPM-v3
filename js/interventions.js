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
        <div class="synop-inter-num"></div>
        <div class="synop-inter-date">${dateFormatted}</div>
        <div class="synop-inter-type"><strong>${inter.type||'INTERVENTION'}</strong></div>
        <div class="synop-inter-lieu">${inter.adresse||'--'}</div>
        <div class="synop-inter-obs">${inter.observations||''}</div>
      </div>
      <div class="synop-inter-details" id="inter-details-${inter.id}">
        ${servicesHTML ? `<div class="synop-services-row">${servicesHTML}</div>` : ''}
        <div class="synop-engins-row">${enginsHTML||'<span style="color:#999;font-size:12px;">Aucun engin engagé</span>'}</div>
        <div class="synop-inter-actions">
          ${userPeutTerminer() ? '<button class="synop-action-btn synop-btn-terminer" onclick="terminerIntervention(\''+inter.id+'\')">' + (currentUser && userHasCOSSIM(currentUser) ? '🔴 Terminer' : '') + '</button>' : ''}
          ${userPeutTerminer() ? '<button class="synop-action-btn synop-btn-renfort" onclick="envoyerRenfort(\''+inter.id+'\')" title="Envoyer un renfort">🚒 Envoyer Renfort</button>' : ''}
          <button class="synop-action-btn synop-btn-info" onclick="infoIntervention('${inter.id}')">ℹ️ Info</button>
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
  if (!i) return;
  const d = i.date ? new Date(i.date) : new Date();
  const dateStr = d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  const enginsList = (i.engins||[]).map(eId => {
    const e = ENGINS.find(x=>x.id===eId);
    const eq = i.equipes?.[eId];
    const gfo = i.enginsGFO?.[eId] || '--';
    const ber = e?.berStatut ? BER_STATUTS.find(b=>b.code===e.berStatut) : null;
    const membres = (eq?.membres||[]).map(m => {
      const u = USERS.find(x=>x.id===m.userId);
      return u ? `<tr><td style="padding:3px 8px;font-weight:700;">${m.abrev}</td><td style="padding:3px 8px;">${u.grade||''}</td><td style="padding:3px 8px;font-weight:800;">${(u.lastname||'').toUpperCase()} ${u.firstname||''}</td></tr>` : '';
    }).join('');
    return `<div style="margin-bottom:12px;border:1px solid var(--border-color);border-radius:8px;overflow:hidden;">
      <div style="background:var(--bg-main);padding:8px 12px;font-weight:900;display:flex;justify-content:space-between;align-items:center;">
        <span>🚒 ${e?.nom||eId} <span style="font-size:11px;color:#a0aec0;">GFO: ${gfo}</span></span>
        ${ber ? '<span style="background:'+ber.couleur+';color:white;font-size:11px;padding:2px 8px;border-radius:4px;">BER '+ber.code+' — '+ber.label+'</span>' : ''}
      </div>
      ${membres ? '<table style="width:100%;border-collapse:collapse;font-size:13px;"><thead><tr><th style="padding:3px 8px;text-align:left;font-size:11px;color:var(--text-muted);">Poste</th><th style="padding:3px 8px;text-align:left;font-size:11px;color:var(--text-muted);">Grade</th><th style="padding:3px 8px;text-align:left;font-size:11px;color:var(--text-muted);">Nom</th></tr></thead><tbody>'+membres+'</tbody></table>' : '<div style="padding:8px 12px;color:var(--text-muted);font-size:12px;font-style:italic;">Équipage non renseigné</div>'}
    </div>`;
  }).join('');

  const servicesHTML = (i.services||[]).map(s=>`<span style="background:rgba(255,255,255,0.06);border:1px solid var(--border-color);border-radius:4px;padding:2px 8px;font-size:12px;">${s}</span>`).join(' ');
  const autresHTML = (i.autresMoyensAlertes||[]).map(m=>`<div style="font-size:13px;">🚒 ${m.enginNom||m.enginId} <span style="color:var(--text-muted);">— GFO: ${m.gfo||'--'}</span></div>`).join('');

  // Créer le modal
  let modal = document.getElementById('modal-info-inter');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'modal-info-inter';
    modal.style.cssText = 'position:fixed;inset:0;z-index:8500;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.onclick = (e) => { if(e.target===modal) modal.remove(); };
    document.body.appendChild(modal);
  }
  modal.innerHTML = `<div style="background:var(--card-bg);border-radius:12px;border:1px solid var(--border-color);width:100%;max-width:680px;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.5);">
    <div style="background:var(--bg-main);padding:14px 20px;border-bottom:2px solid var(--border-color);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;z-index:2;">
      <div>
        <div style="font-weight:900;font-size:15px;color:var(--accent);">#${i.numero||i.id} — ${i.type||'INTERVENTION'}</div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">${dateStr} • ${i.statut||'En cours'}</div>
      </div>
      <button onclick="document.getElementById('modal-info-inter').remove()" style="background:none;border:1px solid var(--border-color);color:var(--text-color);padding:5px 12px;border-radius:6px;cursor:pointer;font-weight:700;">✕</button>
    </div>
    <div style="padding:18px 20px;display:flex;flex-direction:column;gap:14px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;font-size:13px;">
        <div><span style="color:var(--text-muted);font-size:11px;font-weight:700;display:block;text-transform:uppercase;margin-bottom:3px;">Commune</span>${i.commune||'--'}</div>
        <div><span style="color:var(--text-muted);font-size:11px;font-weight:700;display:block;text-transform:uppercase;margin-bottom:3px;">Adresse</span>${i.adresse||'--'}</div>
        <div><span style="color:var(--text-muted);font-size:11px;font-weight:700;display:block;text-transform:uppercase;margin-bottom:3px;">Contact</span>${i.contact||'-'}</div>
        <div><span style="color:var(--text-muted);font-size:11px;font-weight:700;display:block;text-transform:uppercase;margin-bottom:3px;">N° Contre-appel</span>${i.nca||'-'}</div>
        ${i.etablissement ? `<div><span style="color:var(--text-muted);font-size:11px;font-weight:700;display:block;text-transform:uppercase;margin-bottom:3px;">ETARE</span>${i.etablissement}</div>` : ''}
      </div>
      ${i.observations ? `<div><div style="color:var(--text-muted);font-size:11px;font-weight:700;text-transform:uppercase;margin-bottom:4px;">Observations</div><div style="font-size:13px;background:var(--bg-main);padding:8px 12px;border-radius:6px;border:1px solid var(--border-color);">${i.observations}</div></div>` : ''}
      ${servicesHTML ? `<div><div style="color:var(--text-muted);font-size:11px;font-weight:700;text-transform:uppercase;margin-bottom:6px;">Services concernés</div><div style="display:flex;flex-wrap:wrap;gap:4px;">${servicesHTML}</div></div>` : ''}
      <div><div style="color:var(--text-muted);font-size:11px;font-weight:700;text-transform:uppercase;margin-bottom:8px;">Engins engagés</div>${enginsList||'<div style="color:var(--text-muted);font-style:italic;font-size:13px;">Aucun engin</div>'}</div>
      ${autresHTML ? `<div><div style="color:var(--text-muted);font-size:11px;font-weight:700;text-transform:uppercase;margin-bottom:6px;">Autres moyens alertés</div>${autresHTML}</div>` : ''}
      <div style="display:flex;gap:8px;margin-top:4px;">
        <button onclick="window.open('ticket_depart.html?inter=${i.id}&engin=${(i.engins||[])[0]||''}','_blank')" style="background:var(--bg-main);border:1px solid var(--border-color);color:var(--text-color);padding:7px 14px;border-radius:6px;cursor:pointer;font-size:13px;">🖨️ Ticket</button>
        <button onclick="document.getElementById('modal-info-inter').remove()" style="background:var(--accent);border:none;color:white;padding:7px 16px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:700;margin-left:auto;">Fermer</button>
      </div>
    </div>
  </div>`;
  modal.style.display = 'flex';
}

function envoyerRenfort(interId) {
  localStorage.setItem('systel_cossim_inter', interId);
  window.open('cossim.html', '_blank');
}

// ===== BER MODAL IMAGE =====
let berEnginActif = null;
function ouvrirBER(enginId) {
  const engin = ENGINS.find(e => e.id === enginId);
  if (!engin) return;
  berEnginActif = enginId;
  document.getElementById('ber-engin-nom').textContent = engin.nom;
  // Reset position draggable
  if (typeof resetBERPosition === 'function') resetBERPosition();
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
  // Logger dans l'historique
  if (typeof logBERAction === 'function') logBERAction(berEnginActif, code, ber ? ber.label : String(code));
  // Sons BER enchaînés
  if (typeof playBERStatut === 'function') playBERStatut();
  showToast(engin.nom + ' → ' + (ber ? ber.label : code));
}