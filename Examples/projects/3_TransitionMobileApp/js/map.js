function initMap() {
  // create empty map first (so we always see something)
  const map = L.map("map").setView([0, 0], 2);
  L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
      attribution:
        "&copy; OpenStreetMap contributors"
    }
  ).addTo(map);

  // helper to center + drop marker
  function showLocation(lat, lon, desc) {
    map.setView([lat, lon], 15);
    L.marker([lat, lon])
      .addTo(map)
      .bindPopup(desc)
      .openPopup();
  }

  // Try true geolocation first
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude, longitude, accuracy } = pos.coords;
        showLocation(
          latitude,
          longitude,
          `GPS fix<br>Accuracy: ±${Math.round(accuracy)} m`
        );
      },
      err => {
        console.warn("GPS failed:", err);
        loadIPFallback();
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  } else {
    loadIPFallback();
  }

  // Fallback to IP-based lookup via JSONP
  function loadIPFallback() {
    window.ipLookupCallback = function (resp) {
      if (resp && resp.lat && resp.lon) {
        showLocation(
          resp.lat,
          resp.lon,
          `IP lookup:<br>${resp.city}, ${resp.regionName}`
        );
      } else {
        alert("Unable to determine location.");
      }
    };
    const s = document.createElement("script");
    s.src = "http://ip-api.com/json?callback=ipLookupCallback";
    document.body.appendChild(s);
  }
}

document.addEventListener("DOMContentLoaded", initMap);
