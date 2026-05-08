/* ============================================================
   SYSTEL POMPIERS - DATA JS (PTR VERSION v18)
   ============================================================ */

let CONFIG = {
  nom: "Centre de Secours PTR",
  centre: "PTR",
  ville: "Marseille",
  gps: [43.2965, 5.3698]
};

let INTRANET_CONFIG = {
  title: "INTRANET BMPM",
  subtitle: "Intranet BMPM - Simulations",
  items: [
    { id: "systel", title: "SYSTEL", desc: "Système d'Alerte et de Gestion des Moyens", url: "index.html", img: "https://images.unsplash.com/photo-1582139329536-e7284fece509?q=80&w=400&h=400&fit=crop" },
    { id: "cossim", title: "COSSIM", desc: "Centre Opérationnel de Simulation", url: "cossim.html", img: "https://images.unsplash.com/photo-1454165833767-027eeef1593e?q=80&w=400&h=400&fit=crop" }
  ]
};

let CASERNES = [
  {
    id: "bmpm",
    nom: "BMPM",
    sections: [
      { id: "0-EM", nom: "0 - EM" },
      { id: "1-SANTE", nom: "1 - SANTÉ" },
      { id: "2-SLZ", nom: "2 - SLZ" },
      { id: "6-PTR", nom: "6 - PTR" }
    ]
  },
  {
    id: "sdis13",
    nom: "SDIS 13",
    sections: [
      { id: "4-ROG", nom: "4 - ROG" },
      { id: "ALLAUCH", nom: "ALLAUCH" }
    ]
  }
];

let ENGINS = [
  { id: "E1", nom: "VSAV 01", section: "6-PTR", statut: "disponible" },
  { id: "E2", nom: "VPL 01", section: "6-PTR", statut: "intervention" },
  { id: "E3", nom: "FPT 01", section: "4-ROG", statut: "disponible" }
];

let USERS = [
  { id: "admin", lastname: "ADMINISTRATEUR", firstname: "", name: "ADMINISTRATEUR", pwd: "123", role: "ADMIN", grade: "Officier", tel: "06 00 00 00 00", email: "admin@ptr.fr", photo: "" },
  { id: "k.ianis", lastname: "KLEIN", firstname: "Ianis", name: "KLEIN Ianis", pwd: "ptr", role: "BMPM", grade: "Lieutenant", tel: "06 01 02 03 04", email: "k.ianis@ptr.fr", photo: "" }
];

let PLANNING = {};
let INTERVENTIONS = [];
let PERSONNELS = [];
let ANNUAIRE = [];
let currentUser = null;
