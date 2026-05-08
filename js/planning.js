/* ============================================================
   SYSTEL POMPIERS - MODULE PLANNING (v17)
   ============================================================ */

let planningDateDebut = new Date('2026-05-04');

function renderPlanning() {
  const thead = document.getElementById('planning-thead');
  const tbody = document.getElementById('planning-tbody');
  const label = document.getElementById('planning-semaine-label');
  if (!thead || !tbody) return;

  const jours = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(planningDateDebut);
    d.setDate(d.getDate() + i);
    jours.push(d);
  }

  const dateDebStr = jours[0].toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  const dateFinStr = jours[6].toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
  if (label) label.textContent = `DU ${dateDebStr} AU ${dateFinStr}`;

  const jourNoms = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];
  thead.innerHTML = `<tr>
    <th style="min-width:160px; text-align:left;">PERSONNEL</th>
    ${jours.map((d, i) => `<th>${jourNoms[i]}<br>${d.getDate()}/${d.getMonth()+1}</th>`).join('')}
  </tr>`;

  // S'assurer que tous les personnels ont une ligne
  PERSONNELS.forEach(p => { if (!PLANNING[p.id]) PLANNING[p.id] = {}; });

  tbody.innerHTML = PERSONNELS.map(p => {
    const cells = jours.map(d => {
      const key = d.toISOString().slice(0, 10);
      const garde = PLANNING[p.id]?.[key] || '';
      const cls = getGardeClass(garde);
      const short = getGardeShort(garde);
      let canEdit = userIsAdmin(currentUser);
      if (!canEdit && currentUser.id === p.id) canEdit = true;
      const onclick = canEdit ? `onclick="editCellPlanning('${p.id}', '${key}')" style="cursor:pointer;"` : '';
      return `<td class="${cls}" ${onclick} title="${garde || 'Libre'}">${short}</td>`;
    }).join('');

    const isMe = (currentUser.id === p.id);
    return `<tr>
      <td style="font-weight:700; color:var(--primary); ${isMe ? 'background:#ebf8ff;' : ''}">
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="avatar-sm"><img src="${p.photo || 'https://www.w3schools.com/howto/img_avatar.png'}"></div>
          ${p.nom} ${p.prenom}
        </div>
      </td>
      ${cells}
    </tr>`;
  }).join('');
}

function semainePrecedente() { planningDateDebut.setDate(planningDateDebut.getDate() - 7); renderPlanning(); }
function semaineSuivante() { planningDateDebut.setDate(planningDateDebut.getDate() + 7); renderPlanning(); }

function editCellPlanning(personnelId, date) {
  const types = ['G1', 'G2', 'AST', 'REPOS'];
  const actuel = PLANNING[personnelId]?.[date] || 'REPOS';
  const idx = types.indexOf(actuel);
  const next = types[(idx + 1) % types.length];
  if (!PLANNING[personnelId]) PLANNING[personnelId] = {};
  PLANNING[personnelId][date] = next;
  sauvegarderDonnees();
  renderPlanning();
}