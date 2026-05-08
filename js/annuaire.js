/* ============================================================
   SYSTEL POMPIERS - MODULE ANNUAIRE (PTR VERSION)
   ============================================================ */

function renderAnnuaire() {
  const grid = document.getElementById('annuaire-grid');
  if (!grid) return;

  grid.innerHTML = ANNUAIRE.map(c => `
    <div class="card annuaire-card">
      <div class="card-body">
        <div style="display:flex; align-items:center; gap:15px; margin-bottom:10px;">
          <div style="width:40px; height:40px; background:var(--primary); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px;">
            ${c.nom.charAt(0)}
          </div>
          <div>
            <div style="font-weight:700; color:var(--primary); font-size:14px;">${c.nom}</div>
            <div style="font-size:11px; color:var(--text-muted); font-weight:600; text-transform:uppercase;">${c.type}</div>
          </div>
        </div>
        <div style="font-size:12px; display:flex; flex-direction:column; gap:5px;">
          <div style="display:flex; align-items:center; gap:8px;"><span>📞</span> <strong>${c.tel}</strong></div>
          <div style="display:flex; align-items:center; gap:8px;"><span>✉️</span> ${c.email || '---'}</div>
        </div>
      </div>
    </div>
  `).join('');
}
