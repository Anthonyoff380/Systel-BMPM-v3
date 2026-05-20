/* ============================================================
   SYSTEL POMPIERS - DONNÉES (PTR VERSION v18)
   ============================================================ */

let CONFIG = {
  centreAbrev: 'PTR',
  webhooks: {
    ticket: '',
    intervention: '',
    synoptique: ''
  },
  grades_custom: ['Sapeur','SA1 Cls','SA2 Cls','Caporal','Caporal-Chef','Sergent','Sergent-Chef','Adjudant','Adjudant-Chef','Major','BCH','MDC','Lieutenant','Capitaine','Commandant','Lieutenant-Colonel','Colonel','Médecin','Pharmacien'],
  nom: "Centre PTR",
  centre: "PTR",
  ville: "Marseille",
  dateGarde: "Lundi 08 Mai 2026",
  typeGarde: "HIVER JOUR",
  lastUpdate: new Date().toISOString()
};

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

let ENGINS = []; // Chargé depuis localStorage uniquement

const ROLES_DISPONIBLES = ["BMPM", "ADMIN", "SOG/CDG", "COSSIM"];

// Configuration Firebase pour le projet sitebmpm
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyACbm5zQiH-JvvZtHLL4zKiKLHPuByNzvI",
  authDomain: "sitebmpm.firebaseapp.com",
  projectId: "sitebmpm",
  storageBucket: "sitebmpm.firebasestorage.app",
  messagingSenderId: "896341553765",
  appId: "1:896341553765:web:7b7bf7e7f65a3ccd8c0c8c"
};

let USERS = [
  { id: "admin", name: "ADMINISTRATEUR", lastname: "ADMIN", firstname: "Système", pwd: "123", roles: ["ADMIN"], role: "ADMIN", grade: "Officier", tel: "06 00 00 00 00", email: "admin@ptr.fr", photo: null },
  { id: "k.ianis", name: "KLEIN Ianis", lastname: "KLEIN", firstname: "Ianis", pwd: "ptr", roles: ["BMPM"], role: "BMPM", grade: "Sapeur", tel: "06 11 22 33 44", email: "k.ianis@ptr.fr", photo: null }
];

let PERSONNELS = [];
let ANNUAIRE = [];
let PLANNING = {};
let INTERVENTIONS = [];
let currentUser = null;
let FEUILLES_GARDE = {};
let CARTE_BLIPS = [];

// ===== CONFIG COSSIM (éditable depuis admin) =====
let COSSIM_CONFIG = {
  communes: ["Marseille", "Aubagne", "La Ciotat", "Cassis", "Allauch", "Plan-de-Cuques", "Septèmes-les-Vallons"],
  erp: ["Hôpital Nord", "Hôpital Timone", "CHU Conception", "Stade Vélodrome", "Aéroport MRS"],
  erp_consignes: {
    "Hôpital Nord": "Accès pompiers par portail nord. PCC au niveau -1.",
    "Hôpital Timone": "Entrée secours : rue Saint-Pierre. Réferent sécurité en attente.",
    "CHU Conception": "Parking pompiers dédié. Contact sécurité : 04 91 00 00 00.",
    "Stade Vélodrome": "Accès par passerelle Ganay. ERP fermé hors match.",
    "Aéroport MRS": "Zone côté piste : accreditation requise. Contact tour de contrôle."
  },
  gfo_types: ["G-SAP", "G-SSO", "PROMPT_SAP", "G-INC", "PROMPT_INC", "G-DIV", "G-OUV"],
  categories_sinistres: [
    {
      id: "avp", nom: "ACCIDENT / AVP", sinistres: [
        "ACCIDENT DE CIRCULATION",
        "ACCIDENT DE CIRCULATION DÉSINCARCÉRATION",
        "ACCIDENT PIÉTON",
        "ACCIDENT 2 ROUES"
      ]
    },
    {
      id: "inc", nom: "INCENDIE", sinistres: [
        "INCENDIE DE VÉHICULE",
        "INCENDIE D'HABITATION",
        "INCENDIE DE FORÊT / DFCI",
        "INCENDIE LOCAL COMMERCIAL",
        "FEU DE POUBELLES"
      ]
    },
    {
      id: "sap", nom: "SECOURS À PERSONNE", sinistres: [
        "MALAISE / DÉTRESSE",
        "ARRÊT CARDIAQUE",
        "NOYADE",
        "CHUTE",
        "DIVERSES AIDES À PERSONNES"
      ]
    },
    {
      id: "tech", nom: "OPÉRATIONS DIVERSES", sinistres: [
        "EXPLOSION",
        "FUITE DE GAZ",
        "INONDATION",
        "OUVERTURE DE PORTE",
        "DÉGÂT DES EAUX"
      ]
    }
  ],
  services: ["CORD","COZ","DGAC","DIR","ENEDIS","GENDARMERIE","GRDF","OFFICIER CODIS","POLICE NATIONALE","SDIS 13","SAMU 13","CHEF DE SALLE CTA/CODIS","MERLIN (CDC)","ARAMIS Marseille (PREFET)","HERCALES AUB (MCS)","DRAGON 131","MEDECIN LEGAL","COMMUNICATION SDIS 13"]
};

// ===== BER STATUTS =====
const BER_STATUTS = [
  { code: 1, label: "PARTIS",                     couleur: "#f97316", bg: "#fff7ed", textColor: "#9a3412", image: "images/PA.png" },
  { code: 2, label: "SSL",                         couleur: "#ef4444", bg: "#fef2f2", textColor: "#991b1b", image: "images/SL.png" },
  { code: 3, label: "DEMANDE PARLER RADIO",         couleur: null,      bg: "#f1f5f9", textColor: "#475569", image: "images/DM.png" },
  { code: 4, label: "DEMANDE PARLER RADIO URGENT",  couleur: null,      bg: "#fef9c3", textColor: "#713f12", image: "images/DM.png" },
  { code: 5, label: "TRANSPORT CHU",                couleur: "#1e3a8a", bg: "#eff6ff", textColor: "#1e3a8a", image: "images/TH.png" },
  { code: 6, label: "ARRIVÉE CHU",                  couleur: "#38bdf8", bg: "#f0f9ff", textColor: "#0c4a6e", image: "images/AH.png" },
  { code: 7, label: "RETOUR DISPO RADIO",           couleur: "#166534", bg: "#f0fdf4", textColor: "#166534", image: "images/RD.png" },
  { code: 8, label: "RETOUR INDISPO RADIO",         couleur: "#7f1d1d", bg: "#fff1f2", textColor: "#7f1d1d", image: "images/RI.png" },
  { code: 9, label: "DISPO CASERNEMENT",            couleur: "#16a34a", bg: "#dcfce7", textColor: "#14532d", image: "images/COM(3).png" }
];

// ===== UTILS =====
function formatDate(iso) {
  if (!iso) return '--';
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', {hour:'2-digit',minute:'2-digit'});
}
function getStatutBadge(s) {
  if (s === 'En cours') return '<span class="badge badge-danger">EN COURS</span>';
  if (s === 'Terminée') return '<span class="badge badge-success">TERMINÉE</span>';
  return `<span class="badge">${s}</span>`;
}
function getGardeClass(g) {
  if (g === 'G1') return 'cell-g1'; if (g === 'G2') return 'cell-g2'; if (g === 'AST') return 'cell-ast'; return 'cell-repos';
}
function getGardeShort(g) {
  if (g === 'G1') return 'G1'; if (g === 'G2') return 'G2'; if (g === 'AST') return 'AST'; return '';
}
function userHasCOSSIM(user) { return userHasRole(user, 'COSSIM') || userIsAdmin(user); }
function userHasRole(user, role) {
  if (!user) return false;
  if (user.roles && Array.isArray(user.roles)) return user.roles.includes(role);
  return user.role === role;
}
function userIsAdmin(user) { return userHasRole(user, 'ADMIN'); }
function userIsSOG(user) { return userHasRole(user, 'SOG/CDG') || userIsAdmin(user); }
