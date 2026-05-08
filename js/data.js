/* ============================================================
   SYSTEL POMPIERS - DONNÉES (PTR VERSION v11 - CONFIG INTRANET)
   ============================================================ */

let CONFIG = {
  nom: "Centre PTR",
  centre: "PTR",
  ville: "Marseille",
  dateGarde: "Lundi 08 Mai 2026",
  typeGarde: "HIVER JOUR",
  lastUpdate: new Date().toISOString()
};

// Configuration de l'Intranet
let INTRANET_CONFIG = {
  title: "PORTAIL INTRANET",
  subtitle: "Centre de Secours PTR - Marseille",
  items: [
    { id: "systel", title: "SYSTEL", desc: "Gestion opérationnelle et effectifs.", img: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&h=400&fit=crop", url: "index.html" },
    { id: "cossim", title: "COSSIM", desc: "Centre de commandement PTR.", img: "https://images.unsplash.com/photo-1516533076085-50370d2d5c21?w=400&h=400&fit=crop", url: "cossim.html" }
  ]
};

let CASERNES = [
  { id: "BMPM", nom: "BMPM", sections: [
    { id: "0-EM", nom: "0 - EM" },
    { id: "1-SANTE", nom: "1 - SANTÉ" },
    { id: "6-PTR", nom: "6 - PTR" }
  ]}
];

let ENGINS = [
  { id: "VSAV01-PTR", nom: "VSAV 01", section: "6-PTR", statut: "disponible" }
];

let USERS = [
  { 
    id: "admin", 
    name: "ADMINISTRATEUR", 
    pwd: "123", 
    role: "ADMIN", 
    grade: "Officier",
    tel: "06 00 00 00 00",
    email: "admin@ptr.fr",
    photo: null 
  },
  { 
    id: "k.ianis", 
    name: "KLEIN Ianis", 
    pwd: "ptr", 
    role: "BMPM", 
    grade: "Sapeur",
    tel: "06 11 22 33 44",
    email: "k.ianis@ptr.fr",
    photo: null
  }
];

let PERSONNELS = [];
let ANNUAIRE = [];
let PLANNING = {};
let INTERVENTIONS = [];
let currentUser = null;
