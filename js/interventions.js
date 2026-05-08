/* ============================================================
   SYSTEL POMPIERS - MODULE INTERVENTIONS (PTR VERSION)
   ============================================================ */

function renderInterventions() {
  const tbody = document.getElementById('interventions-tbody');
  if (!tbody) return;

  const search = document.getElementById('search-intervention')?.value.toLowerCase() || '';
  const statut = document.getElementById('filtre-statut')?.value || '';

  const filtres = INTERVENTIONS.filter(i => {
    const matchSearch = !search || i.type.toLowerCase().includes(search) || i.adresse.toLowerCase().includes(search);
    const matchStatut = !statut || i.statut === statut;
    return matchSearch && matchStatut;
  });

  tbody.innerHTML = filtres.map(i => `
    <tr>
      <td style="font-weight:700; color:var(--primary);">#${i.id}</td>
      <td>${formatDate(i.date)}</td>
      <td style="color:var(--accent); font-weight:700;">${i.type}</td>
      <td>${i.adresse}</td>
      <td>${i.engins.join(', ')}</td>
      <td>${getStatutBadge(i.statut)}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editerIntervention('${i.id}')">✎</button>
        <button class="btn btn-danger btn-sm" onclick="supprimerIntervention('${i.id}')">✕</button>
      </td>
    </tr>
  `).join('');
}

function nouvelleIntervention() {
  const type = prompt("Type d'intervention :");
  const addr = prompt("Adresse :");
  if (type && addr) {
    const id = "2026-" + (INTERVENTIONS.length + 1).toString().padStart(3, '0');
    INTERVENTIONS.push({
      id: id,
      date: new Date().toISOString(),
      type: type,
      adresse: addr,
      engins: [],
      statut: "En cours"
    });
    sauvegarderDonnees();
    renderInterventions();
    updateSynoptique();
    showToast("Intervention créée !");
  }
}

function editerIntervention(id) {
  const i = INTERVENTIONS.find(x => x.id === id);
  if (!i) return;
  const s = prompt("Nouveau statut (En cours / Terminée) :", i.statut);
  if (s) {
    i.statut = s;
    sauvegarderDonnees();
    renderInterventions();
    updateSynoptique();
  }
}

function supprimerIntervention(id) {
  if (confirm("Supprimer cette intervention ?")) {
    INTERVENTIONS = INTERVENTIONS.filter(i => i.id !== id);
    sauvegarderDonnees();
    renderInterventions();
    updateSynoptique();
  }
}

function filtrerInterventions() { renderInterventions(); }
