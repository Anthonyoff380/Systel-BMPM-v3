/* ============================================================
   SYSTEL POMPIERS - MODULE EFFECTIFS (PTR VERSION)
   ============================================================ */

function renderPersonnels() {
  const tbody = document.getElementById('personnels-tbody');
  if (!tbody) return;

  tbody.innerHTML = PERSONNELS.map(p => `
    <tr>
      <td style="font-weight:700; color:var(--primary);">${p.nom}</td>
      <td>${p.prenom}</td>
      <td><span class="badge badge-info">${p.grade}</span></td>
      <td>${p.specialite}</td>
      <td><span class="badge ${p.statut.includes('Garde') ? 'badge-success' : 'badge-warning'}">${p.statut}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editerPersonnel(${p.id})">✎</button>
        <button class="btn btn-danger btn-sm" onclick="supprimerPersonnel(${p.id})">✕</button>
      </td>
    </tr>
  `).join('');
}

function ajouterPersonnel() {
  const nom = prompt("Nom :");
  const prenom = prompt("Prénom :");
  if (nom && prenom) {
    PERSONNELS.push({
      id: Date.now(),
      nom: nom.toUpperCase(),
      prenom: prenom,
      grade: "Sapeur",
      specialite: "INC",
      statut: "Repos",
      disponible: true
    });
    sauvegarderDonnees();
    renderPersonnels();
    updateSynoptique();
  }
}

function editerPersonnel(id) {
  const p = PERSONNELS.find(x => x.id === id);
  if (!p) return;
  const n = prompt("Nouveau grade :", p.grade);
  if (n) {
    p.grade = n;
    sauvegarderDonnees();
    renderPersonnels();
  }
}

function supprimerPersonnel(id) {
  if (confirm("Supprimer ce personnel ?")) {
    PERSONNELS = PERSONNELS.filter(p => p.id !== id);
    sauvegarderDonnees();
    renderPersonnels();
    updateSynoptique();
  }
}
