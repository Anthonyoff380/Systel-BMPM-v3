/* ============================================================
   SYSTEL POMPIERS - DONNÉES INITIALES (CENTRE PTR)
   ============================================================ */

let CONFIG = {
  centre: "PTR",
  nom: "Centre de Secours PTR",
  ville: "Marseille",
  departement: "13",
  dateGarde: "Vendredi 08 Mai 2026",
  heureDebut: "07:30",
  heureFin: "07:30",
  typeGarde: "HIVER JOUR",
  coordonnees: { lat: 43.2965, lng: 5.3810 }
};

let USERS = [
  { id: "admin", pwd: "123", name: "Administrateur", role: "ADMIN" },
  { id: "k.ianis", pwd: "ptr", name: "KLEIN Ianis", role: "BMPM" }
];

let ENGINS = [
  { id: "VSAV01", nom: "VSAV 01", type: "Ambulance", statut: "disponible", etat: "P" },
  { id: "VSAV02", nom: "VSAV 02", type: "Ambulance", statut: "disponible", etat: "P" },
  { id: "FPT01", nom: "FPT 01", type: "Fourgon", statut: "disponible", etat: "P" },
  { id: "EPA01", nom: "EPA 01", type: "Echelle", statut: "disponible", etat: "P" },
  { id: "CCF01", nom: "CCF 01", type: "Feu de forêt", statut: "indisponible", etat: "H" }
];

let PERSONNELS = [
  { id: 1, nom: "KLEIN", prenom: "Ianis", grade: "Caporal", specialite: "INC", statut: "Garde 1", disponible: true },
  { id: 2, nom: "DURAND", prenom: "Michel", grade: "Sergent", specialite: "DIV", statut: "Garde 1", disponible: true },
  { id: 3, nom: "LEFEBVRE", prenom: "Julie", grade: "Sapeur", specialite: "SAP", statut: "Repos", disponible: true }
];

let INTERVENTIONS = [
  { id: "2026-001", date: "2026-05-08T10:15:00", type: "Secours à personne", adresse: "12 Rue de la République", engins: ["VSAV 01"], statut: "En cours" }
];

let PLANNING = {}; 

let ANNUAIRE = [
  { id: 1, nom: "SAMU 13", type: "Service", tel: "15", email: "samu13@chu-marseille.fr" },
  { id: 2, nom: "Police Nationale", type: "Service", tel: "17", email: "contact@police.fr" }
];

let currentUser = null;
