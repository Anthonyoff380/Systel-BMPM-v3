/* ============================================================
   SYSTEL POMPIERS - DONNÉES (PTR VERSION v6 - ZÉRO RÉSIDU)
   ============================================================ */

let CONFIG = {
  nom: "Centre PTR",
  centre: "PTR",
  ville: "Marseille",
  dateGarde: "Lundi 08 Mai 2026",
  typeGarde: "HIVER JOUR",
  lastUpdate: new Date().toISOString()
};

// STRUCTURE DES CASERNES (Initialisée avec l'image, mais modifiable via Admin)
let CASERNES = [
  { id: "BMPM", nom: "BMPM", sections: [
    { id: "0-EM", nom: "0 - EM" },
    { id: "1-SANTE", nom: "1 - SANTÉ" },
    { id: "2-SLZ", nom: "2 - SLZ" },
    { id: "3-END", nom: "3 - END" },
    { id: "4-LBG", nom: "4 - LBG" },
    { id: "5-PLB", nom: "5 - PLB" },
    { id: "6-PTR", nom: "6 - PTR" },
    { id: "7-SSLIA", nom: "7 - SSLIA" }
  ]},
  { id: "SDIS13", nom: "SDIS 13", sections: [
    { id: "0-EM-13", nom: "0 - EM" },
    { id: "2-SLP", nom: "2 - SLP" },
    { id: "3-BER", nom: "3 - BER" },
    { id: "4-ROG", nom: "4 - ROG" },
    { id: "ALLAUCH", nom: "ALLAUCH" }
  ]},
  { id: "SECUCIV", nom: "SECURITE CIVILE", sections: [
    { id: "AERO", nom: "AERO" }
  ]}
];

// LISTE DES ENGINS (Modifiable via Admin)
let ENGINS = [
  { id: "VTP002", nom: "VTP 002", section: "0-EM", statut: "disponible" },
  { id: "VMS10", nom: "VMS 10", section: "1-SANTE", statut: "disponible" },
  { id: "VSAV01-PTR", nom: "VSAV 01", section: "6-PTR", statut: "disponible" },
  { id: "VSAV01-ROG", nom: "VSAV 01", section: "4-ROG", statut: "intervention" }
];

// COMPTES UTILISATEURS (Seul le compte admin est présent par défaut)
let USERS = [
  { id: "admin", name: "ADMINISTRATEUR", pwd: "123", role: "ADMIN" }
];

// LIAISON STRICTE : Les personnels, l'annuaire et le planning seront générés uniquement à partir des USERS
let PERSONNELS = [];
let ANNUAIRE = [];
let PLANNING = {};

let INTERVENTIONS = [];
let currentUser = null;
