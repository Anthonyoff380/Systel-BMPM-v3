/* ============================================================
   SYSTEL POMPIERS - DONNÉES (PTR VERSION v5 - SYNOPTIQUE DES MOYENS)
   ============================================================ */

let CONFIG = {
  nom: "Centre PTR",
  centre: "PTR",
  ville: "Marseille",
  dateGarde: "Lundi 08 Mai 2026",
  typeGarde: "HIVER JOUR",
  lastUpdate: new Date().toISOString()
};

// STRUCTURE DES CASERNES (Basé sur l'image)
let CASERNES = [
  { id: "BMPM", nom: "BMPM", sections: [
    { id: "0-EM", nom: "0 - EM", color: "red" },
    { id: "1-SANTE", nom: "1 - SANTÉ", color: "green" },
    { id: "2-SLZ", nom: "2 - SLZ", color: "red" },
    { id: "3-END", nom: "3 - END", color: "red" },
    { id: "4-LBG", nom: "4 - LBG", color: "red" },
    { id: "5-PLB", nom: "5 - PLB", color: "red" },
    { id: "6-PTR", nom: "6 - PTR", color: "red" },
    { id: "7-SSLIA", nom: "7 - SSLIA", color: "red" }
  ]},
  { id: "SDIS13", nom: "SDIS 13", sections: [
    { id: "0-EM-13", nom: "0 - EM", color: "red" },
    { id: "2-SLP", nom: "2 - SLP", color: "red" },
    { id: "3-BER", nom: "3 - BER", color: "red" },
    { id: "4-ROG", nom: "4 - ROG", color: "green" },
    { id: "ALLAUCH", nom: "ALLAUCH", color: "red" }
  ]},
  { id: "SECUCIV", nom: "SECURITE CIVILE", sections: [
    { id: "AERO", nom: "AERO", color: "red" }
  ]}
];

let ENGINS = [
  // BMPM - EM
  { id: "VTP002", nom: "VTP 002", section: "0-EM", statut: "disponible" },
  { id: "VTP01", nom: "VTP 01", section: "0-EM", statut: "disponible" },
  { id: "VRF01", nom: "VRF 01", section: "0-EM", statut: "disponible" },
  { id: "PCC01", nom: "PCC 01", section: "0-EM", statut: "disponible" },
  
  // BMPM - SANTE
  { id: "VMS10", nom: "VMS 10", section: "1-SANTE", statut: "disponible" },
  { id: "VMS20", nom: "VMS 20", section: "1-SANTE", statut: "disponible" },
  { id: "AR01", nom: "AR 01", section: "1-SANTE", statut: "disponible" },
  { id: "AR02", nom: "AR 02", section: "1-SANTE", statut: "disponible" },
  
  // BMPM - PTR (VOTRE CENTRE)
  { id: "VSAV01-PTR", nom: "VSAV 01", section: "6-PTR", statut: "disponible" },
  { id: "VPL01", nom: "VPL 01", section: "6-PTR", statut: "intervention" },
  { id: "VPI01", nom: "VPI 01", section: "6-PTR", statut: "disponible" },
  { id: "CCFM01-PTR", nom: "CCFM 01", section: "6-PTR", statut: "disponible" },
  
  // SDIS 13 - ROG
  { id: "VSAV01-ROG", nom: "VSAV 01", section: "4-ROG", statut: "intervention" },
  { id: "VRM01", nom: "VRM 01", section: "4-ROG", statut: "disponible" },
  { id: "VLCG01", nom: "VLCG 01", section: "4-ROG", statut: "intervention" },
  { id: "FPT01-ROG", nom: "FPT 01", section: "4-ROG", statut: "disponible" }
];

let USERS = [
  { id: "admin", name: "ADMINISTRATEUR", pwd: "123", role: "ADMIN" },
  { id: "k.ianis", name: "KLEIN Ianis", pwd: "ptr", role: "BMPM" }
];

let PERSONNELS = [
  { id: 1, nom: "KLEIN", prenom: "Ianis", grade: "Sapeur", specialite: "INC", statut: "Garde 1", disponible: true }
];

let ANNUAIRE = [
  { id: 1, nom: "KLEIN Ianis", type: "Personnel", tel: "06 00 00 00 00", email: "i.klein@ptr.fr" }
];

let INTERVENTIONS = [];
let PLANNING = {};
let currentUser = null;
