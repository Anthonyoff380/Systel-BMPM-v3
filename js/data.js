/* ============================================================
   SYSTEL POMPIERS - DONNÉES (PTR VERSION v7 - PHOTOS & PROFILS)
   ============================================================ */

let CONFIG = {
  nom: "Centre PTR",
  centre: "PTR",
  ville: "Marseille",
  dateGarde: "Lundi 08 Mai 2026",
  typeGarde: "HIVER JOUR",
  lastUpdate: new Date().toISOString()
};

let CASERNES = [
  { id: "BMPM", nom: "BMPM", sections: [
    { id: "0-EM", nom: "0 - EM" },
    { id: "1-SANTE", nom: "1 - SANTÉ" },
    { id: "6-PTR", nom: "6 - PTR" }
  ]},
  { id: "SDIS13", nom: "SDIS 13", sections: [
    { id: "4-ROG", nom: "4 - ROG" }
  ]}
];

let ENGINS = [
  { id: "VSAV01-PTR", nom: "VSAV 01", section: "6-PTR", statut: "disponible" }
];

// USERS avec support photo (Base64)
let USERS = [
  { 
    id: "admin", 
    name: "ADMINISTRATEUR", 
    pwd: "123", 
    role: "ADMIN", 
    grade: "Officier",
    photo: null // Sera une string base64
  },
  { 
    id: "k.ianis", 
    name: "KLEIN Ianis", 
    pwd: "ptr", 
    role: "BMPM", 
    grade: "Sapeur",
    photo: null
  }
];

let PERSONNELS = [];
let ANNUAIRE = [];
let PLANNING = {};
let INTERVENTIONS = [];
let currentUser = null;
