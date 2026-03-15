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

  decodePolyline: function(encoded) {
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

      coordinates.push([lat / 1e5, lng / 1e5]);
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

  formatInstruction: function(step) {
    var type = step.maneuver.type;
    var modifier = step.maneuver.modifier || '';
    var name = step.name || 'unnamed road';
    var exit = step.maneuver.exit || '';

    switch (type) {
      case 'depart':
        return 'Head ' + (modifier || 'forward') + ' on ' + name;
      case 'arrive':
        return 'Arrive at destination';
      case 'turn':
        return 'Turn ' + modifier + ' onto ' + name;
      case 'continue':
        return 'Continue on ' + name;
      case 'roundabout':
        return 'At roundabout, take exit ' + exit + ' onto ' + name;
      case 'merge':
        return 'Merge onto ' + name;
      case 'fork':
        return 'Keep ' + modifier + ' onto ' + name;
      case 'end of road':
        return 'Turn ' + modifier + ' onto ' + name;
      case 'new name':
        return 'Continue onto ' + name;
      case 'notification':
        return 'Continue on ' + name;
      default:
        return 'Continue on ' + name;
    }
  },

  getManeuverIcon: function(type, modifier) {
    if (type === 'depart') return '\u{1F6B6}';
    if (type === 'arrive') return '\u{1F3C1}';

    switch (modifier) {
      case 'straight': return '\u2191';
      case 'slight right': return '\u2197';
      case 'right': return '\u2192';
      case 'sharp right': return '\u2198';
      case 'uturn': return '\u2193';
      case 'sharp left': return '\u2199';
      case 'left': return '\u2190';
      case 'slight left': return '\u2196';
      default: return '\u2191';
    }
  }
};
