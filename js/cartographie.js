/* ============================================================
   SYSTEL POMPIERS - MODULE CARTOGRAPHIE (v17)
   Carte GTA5 + Blips admin
   ============================================================ */

let carteInitialisee = false;
let carteLeaflet = null;
let blipMarkers = {};

const BLIP_TYPES = [
  { id: "caserne",    label: "Centre de secours",     emoji: "🏚️" },
  { id: "dfci",       label: "DFCI",                  emoji: "🌲" },
  { id: "poteau",     label: "Poteau incendie",        emoji: "🔴" },
  { id: "bouchon",    label: "Circulation bloquée",    emoji: "🚧" },
  { id: "coupure",    label: "Route coupée",           emoji: "⛔" },
  { id: "danger",     label: "Zone dangereuse",        emoji: "⚠️" },
  { id: "custom",     label: "Point personnalisé",     emoji: "📍" }
];

function initCartographie() {
  if (carteInitialisee) { refreshBlips(); return; }
  carteInitialisee = true;

  // Admin: afficher les outils
  const adminTools = document.getElementById('carto-admin-tools');
  if (adminTools) adminTools.style.display = userIsAdmin(currentUser) ? 'block' : 'none';

  // Init Leaflet avec la carte GTA5
  const mapEl = document.getElementById('carto-map');
  if (!mapEl) return;

  carteLeaflet = L.map('carto-map', { crs: L.CRS.Simple, minZoom: -2, maxZoom: 2 });

  // Image de fond : carte GTA5
  const imageUrl = 'https://gtaxscripting.blogspot.com/p/gta-v-map.html';
  // On utilise une image publique de la carte GTA5
  const bounds = [[-4096, -4096], [4096, 4096]];
  L.imageOverlay('https://i.imgur.com/67XcHDx.jpg', bounds).addTo(carteLeaflet);
  carteLeaflet.fitBounds(bounds);

  // Click pour ajouter un blip (admin seulement)
  carteLeaflet.on('click', function(e) {
    if (!userIsAdmin(currentUser)) return;
    ouvrirAjoutBlip(e.latlng.lat, e.latlng.lng);
  });

  refreshBlips();
}

function refreshBlips() {
  if (!carteLeaflet) return;
  // Supprimer anciens markers
  Object.values(blipMarkers).forEach(m => carteLeaflet.removeLayer(m));
  blipMarkers = {};

  CARTE_BLIPS.forEach(blip => {
    const type = BLIP_TYPES.find(t => t.id === blip.type) || BLIP_TYPES[6];
    const icon = L.divIcon({
      html: `<div class="blip-marker" title="${blip.label}">${type.emoji}</div>`,
      iconSize: [30, 30],
      className: ''
    });
    const marker = L.marker([blip.lat, blip.lng], { icon }).addTo(carteLeaflet);
    marker.bindPopup(`<b>${type.emoji} ${blip.label}</b><br><small>${type.label}</small>${userIsAdmin(currentUser) ? `<br><button onclick="supprimerBlip('${blip.id}')" style="margin-top:5px; background:#e53e3e; color:white; border:none; padding:3px 8px; border-radius:4px; cursor:pointer;">Supprimer</button>` : ''}`);
    blipMarkers[blip.id] = marker;
  });
}

function ouvrirAjoutBlip(lat, lng) {
  document.getElementById('blip-lat').value = lat.toFixed(2);
  document.getElementById('blip-lng').value = lng.toFixed(2);
  document.getElementById('blip-label').value = '';
  const sel = document.getElementById('blip-type-select');
  sel.innerHTML = BLIP_TYPES.map(t => `<option value="${t.id}">${t.emoji} ${t.label}</option>`).join('');
  ouvrirModal('modal-ajout-blip');
}

function confirmerAjoutBlip() {
  const lat = parseFloat(document.getElementById('blip-lat').value);
  const lng = parseFloat(document.getElementById('blip-lng').value);
  const label = document.getElementById('blip-label').value || 'Point';
  const type = document.getElementById('blip-type-select').value;
  CARTE_BLIPS.push({ id: 'blip_' + Date.now(), lat, lng, label, type });
  sauvegarderDonnees();
  fermerModal();
  refreshBlips();
  showToast("Blip ajouté !");
}

function supprimerBlip(id) {
  CARTE_BLIPS = CARTE_BLIPS.filter(b => b.id !== id);
  sauvegarderDonnees();
  refreshBlips();
  if (carteLeaflet) carteLeaflet.closePopup();
  showToast("Blip supprimé");
}

function renderListeBlips() {
  const container = document.getElementById('blips-liste');
  if (!container) return;
  if (CARTE_BLIPS.length === 0) { container.innerHTML = '<p style="color:#999; font-size:12px;">Aucun blip</p>'; return; }
  container.innerHTML = CARTE_BLIPS.map(blip => {
    const type = BLIP_TYPES.find(t => t.id === blip.type) || BLIP_TYPES[6];
    return `<div class="blip-list-item">
      <span>${type.emoji} ${blip.label}</span>
      <button class="btn btn-danger btn-sm" onclick="supprimerBlip('${blip.id}')">✕</button>
    </div>`;
  }).join('');
}