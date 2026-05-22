/* ============================================================
   SYSTEL POMPIERS - MODULE CARTOGRAPHIE (v18)
   Carte GTA5 locale avec Leaflet CRS.Simple + blips
   ============================================================ */

let carteInitialisee = false;
let carteLeaflet = null;
let blipMarkers = {};
let blipClickLat = 0, blipClickLng = 0;

const BLIP_TYPES = [
  { id: "caserne",  label: "Centre de secours",  emoji: "🚒" },
  { id: "dfci",     label: "DFCI",               emoji: "🌲" },
  { id: "poteau",   label: "Poteau incendie",     emoji: "🔴" },
  { id: "bouchon",  label: "Circulation bloquée", emoji: "🚧" },
  { id: "coupure",  label: "Route coupée",        emoji: "⛔" },
  { id: "danger",   label: "Zone dangereuse",     emoji: "⚠️" },
  { id: "custom",   label: "Point custom",        emoji: "📍" }
];

function initCartographie() {
  const mapEl = document.getElementById('carto-map');
  if (!mapEl) return;

  // Forcer une hauteur si pas déjà définie
  if (!mapEl.style.height || mapEl.offsetHeight < 100) {
    mapEl.style.height = 'calc(100vh - 200px)';
    mapEl.style.minHeight = '450px';
  }

  // Si déjà initialisée, juste refresher
  if (carteInitialisee && carteLeaflet) {
    try {
      carteLeaflet.invalidateSize();
      refreshBlips();
      const adminTools = document.getElementById('carto-admin-tools');
      if (adminTools) adminTools.style.display = userIsAdmin(currentUser) ? 'block' : 'none';
      renderListeBlips();
      return;
    } catch(e) {
      carteInitialisee = false;
      carteLeaflet = null;
    }
  }
  carteInitialisee = true;

  const adminTools = document.getElementById('carto-admin-tools');
  if (adminTools) adminTools.style.display = userIsAdmin(currentUser) ? 'block' : 'none';

  // Dimensions image GTA5 : on utilise CRS.Simple
  // L'image fait environ 877x1310 pixels
  const imgW = 877, imgH = 1310;
  carteLeaflet = L.map('carto-map', {
    crs: L.CRS.Simple,
    minZoom: -2,
    maxZoom: 3,
    zoomSnap: 0.5
  });

  // Bounds calés sur les dims de l'image
  const bounds = [[0, 0], [imgH, imgW]];
  const imageLayer = L.imageOverlay('images/gta5map.png', bounds);
  imageLayer.addTo(carteLeaflet);
  carteLeaflet.fitBounds(bounds);

  // Click pour ajouter blip (admin seulement)
  carteLeaflet.on('click', function(e) {
    if (!userIsAdmin(currentUser)) return;
    blipClickLat = e.latlng.lat;
    blipClickLng = e.latlng.lng;
    ouvrirAjoutBlip(blipClickLat, blipClickLng);
  });

  refreshBlips();
}

function refreshBlips() {
  if (!carteLeaflet) return;
  Object.values(blipMarkers).forEach(m => carteLeaflet.removeLayer(m));
  blipMarkers = {};

  CARTE_BLIPS.forEach(blip => {
    const type = BLIP_TYPES.find(t => t.id === blip.type) || BLIP_TYPES[6];
    const icon = L.divIcon({
      html: `<div class="blip-marker-pin" title="${blip.label}">
        <div class="blip-emoji">${type.emoji}</div>
        <div class="blip-label-tag">${blip.label}</div>
      </div>`,
      iconSize: [40, 50],
      iconAnchor: [20, 50],
      className: ''
    });
    const marker = L.marker([blip.lat, blip.lng], { icon }).addTo(carteLeaflet);
    const isAdmin = userIsAdmin(currentUser);
    marker.bindPopup(`
      <div style="text-align:center;min-width:120px;">
        <div style="font-size:28px;">${type.emoji}</div>
        <div style="font-weight:800;font-size:14px;margin:4px 0;">${blip.label}</div>
        <div style="font-size:11px;color:#718096;">${type.label}</div>
        ${isAdmin ? `<button onclick="supprimerBlip('${blip.id}')" style="margin-top:8px;background:#e53e3e;color:white;border:none;padding:4px 10px;border-radius:4px;cursor:pointer;width:100%;">🗑️ Supprimer</button>` : ''}
      </div>`
    );
    blipMarkers[blip.id] = marker;
  });

  renderListeBlips();
}

function ouvrirAjoutBlip(lat, lng) {
  document.getElementById('blip-lat').value = lat.toFixed(1);
  document.getElementById('blip-lng').value = lng.toFixed(1);
  document.getElementById('blip-label').value = '';
  document.getElementById('blip-type-select').innerHTML = BLIP_TYPES.map(t =>
    `<option value="${t.id}">${t.emoji} ${t.label}</option>`).join('');
  ouvrirModal('modal-ajout-blip');
}

function confirmerAjoutBlip() {
  const lat = parseFloat(document.getElementById('blip-lat').value);
  const lng = parseFloat(document.getElementById('blip-lng').value);
  const label = document.getElementById('blip-label').value || 'Point';
  const type = document.getElementById('blip-type-select').value;
  CARTE_BLIPS.push({ id: 'blip_'+Date.now(), lat, lng, label, type });
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
  if (CARTE_BLIPS.length === 0) {
    container.innerHTML = '<p style="color:#999;font-size:12px;font-style:italic;">Aucun blip — cliquez sur la carte pour en ajouter</p>';
    return;
  }
  container.innerHTML = CARTE_BLIPS.map(blip => {
    const type = BLIP_TYPES.find(t => t.id === blip.type) || BLIP_TYPES[6];
    return `<div class="blip-list-item">
      <span>${type.emoji} <strong>${blip.label}</strong> <span style="font-size:10px;color:#999;">${type.label}</span></span>
      <button class="btn btn-danger btn-sm" onclick="supprimerBlip('${blip.id}')">✕</button>
    </div>`;
  }).join('');
}