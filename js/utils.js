window.RouteApp = window.RouteApp || {};

window.RouteApp.Utils = {

  debounce: function(fn, delay) {
    var timer = null;
    return function() {
      var context = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function() {
        fn.apply(context, args);
      }, delay);
    };
  },

  haversine: function(lat1, lon1, lat2, lon2) {
    var R = 6371;
    var dLat = (lat2 - lat1) * Math.PI / 180;
    var dLon = (lon2 - lon1) * Math.PI / 180;
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  },

  decodePolyline: function(encoded, precision) {
    var factor = Math.pow(10, precision || 5);
    var coordinates = [];
    var index = 0;
    var lat = 0;
    var lng = 0;

    while (index < encoded.length) {
      var shift = 0;
      var result = 0;
      var byte;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1F) << shift;
        shift += 5;
      } while (byte >= 0x20);

      var dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        byte = encoded.charCodeAt(index++) - 63;
        result |= (byte & 0x1F) << shift;
        shift += 5;
      } while (byte >= 0x20);

      var dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
  },

  formatDistance: function(meters) {
    if (meters < 1000) {
      return Math.round(meters) + ' m';
    }
    return (meters / 1000).toFixed(1) + ' km';
  },

  formatDuration: function(seconds) {
    var totalMin = Math.round(seconds / 60);
    if (totalMin < 60) {
      return totalMin + ' min';
    }
    var h = Math.floor(totalMin / 60);
    var min = totalMin % 60;
    return h + 'h ' + min + 'min';
  },

  getManeuverIcon: function(type) {
    // Valhalla maneuver types (numeric)
    switch (type) {
      case 1: case 2: case 3: return '\u{1F6B6}'; // Start
      case 4: case 5: case 6: return '\u{1F3C1}'; // Destination
      case 9: case 18: return '\u2197';  // Slight right
      case 10: return '\u2192';           // Right
      case 11: return '\u2198';           // Sharp right
      case 12: return '\u2193';           // U-turn right
      case 13: return '\u2193';           // U-turn left
      case 14: return '\u2199';           // Sharp left
      case 15: return '\u2190';           // Left
      case 16: case 19: return '\u2196';  // Slight left
      case 26: case 27: return '\u21BB';  // Roundabout
      default: return '\u2191';           // Straight / continue
    }
  }
};
