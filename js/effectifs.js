/* ============================================================
   SYSTEL BMPM - MODULE EFFECTIFS v18 (REFAIT COMPLET)
   ============================================================ */

function renderEffectifs() {
  const container = document.getElementById('effectifs-container');
  if (!container) return;

  const sessionUser = sessionStorage.getItem('systel_user');
  const connectedId = sessionUser ? JSON.parse(sessionUser).id : null;

  // Synchro statuts + grades depuis USERS
  PERSONNELS.forEach(p => {
    const user = USERS.find(u => u.id === p.id);
    p.statut = (connectedId && connectedId === p.id) ? "DISPO" : "INDISPO";
    if (user && user.grade && user.grade !== 'undefined') p.grade = user.grade;
    else if (!p.grade || p.grade === 'undefined') p.grade = 'Sapeur';
  });

  const dispo = PERSONNELS.filter(p => p.statut === 'DISPO');
  const indispo = PERSONNELS.filter(p => p.statut === 'INDISPO');
  const total = PERSONNELS.length;

  container.innerHTML = `
    <!-- BANDEAU STATS -->
    <div class="eff-stats-row">
      <div class="eff-stat-card eff-stat-green">
        <div class="eff-stat-icon">✔</div>
        <div class="eff-stat-body">
          <div class="eff-stat-val">${dispo.length}</div>
          <div class="eff-stat-lbl">DISPONIBLES</div>
        </div>
      </div>
      <div class="eff-stat-card eff-stat-red">
        <div class="eff-stat-icon">✖</div>
        <div class="eff-stat-body">
          <div class="eff-stat-val">${indispo.length}</div>
          <div class="eff-stat-lbl">INDISPONIBLES</div>
        </div>
      </div>
      <div class="eff-stat-card eff-stat-blue">
        <div class="eff-stat-icon">👥</div>
        <div class="eff-stat-body">
          <div class="eff-stat-val">${total}</div>
          <div class="eff-stat-lbl">TOTAL</div>
        </div>
      </div>
      <div class="eff-stat-card eff-stat-orange">
        <div class="eff-stat-icon">📊</div>
        <div class="eff-stat-body">
          <div class="eff-stat-val">${total > 0 ? Math.round(dispo.length/total*100) : 0}%</div>
          <div class="eff-stat-lbl">TAUX DISPO</div>
        </div>
      </div>
    </div>

    <!-- GRILLE PERSONNEL -->
    <div class="eff-section-title"><span class="eff-dot green"></span> PERSONNELS DISPONIBLES (${dispo.length})</div>
    <div class="eff-grid">
      ${dispo.map(p => renderEffectifCard(p, true)).join('') || '<div class="eff-empty">Aucun personnel disponible</div>'}
    </div>

    ${indispo.length > 0 ? `
      <div class="eff-section-title" style="margin-top:20px;"><span class="eff-dot red"></span> PERSONNELS INDISPONIBLES (${indispo.length})</div>
      <div class="eff-grid eff-grid-indispo">
        ${indispo.map(p => renderEffectifCard(p, false)).join('')}
      </div>
    ` : ''}
  `;
}

function renderEffectifCard(p, isDispo) {
  const grade = (p.grade && p.grade !== 'undefined') ? p.grade : 'N/A';
  const u = USERS.find(x => x.id === p.id);
  const gradeBadgeClass = getGradeBadgeClass(grade);
  return `
    <div class="eff-card ${isDispo ? 'eff-card-dispo' : 'eff-card-indispo'}" onclick="showPersonnelDetail('${p.id}')">
      <div class="eff-card-status-bar ${isDispo ? 'bar-dispo' : 'bar-indispo'}"></div>
      <div class="eff-card-inner">
        <div class="eff-avatar-wrap">
          <img src="${p.photo || 'https://www.w3schools.com/howto/img_avatar.png'}"
               onerror="this.src='https://www.w3schools.com/howto/img_avatar.png'"
               class="eff-avatar-img">
          <div class="eff-status-dot ${isDispo ? 'dot-dispo' : 'dot-indispo'}"></div>
        </div>
        <div class="eff-card-info">
          <div class="eff-card-nom">${p.nom} ${p.prenom}</div>
          <div class="eff-card-grade ${gradeBadgeClass}">${grade}</div>
          ${u ? `<div class="eff-card-role">${u.role}</div>` : ''}
        </div>
        <div class="eff-card-badge ${isDispo ? 'badge-dispo' : 'badge-indispo'}">${p.statut}</div>
      </div>
    </div>
  `;
}

function getGradeBadgeClass(grade) {
  const officiers = ['Lieutenant', 'Capitaine', 'Commandant', 'Lieutenant-Colonel', 'Colonel'];
  const sof = ['Adjudant', 'Adjudant-Chef', 'Sergent', 'Sergent-Chef'];
  const officier = ['Officier'];
  if (officiers.includes(grade) || officier.includes(grade)) return 'grade-officier';
  if (sof.includes(grade)) return 'grade-sof';
  return 'grade-sp';
}
