window.RouteApp = window.RouteApp || {};

window.RouteApp.Geocoding = {
  _lastRequestTime: 0,

  _throttle: function() {
    var now = Date.now();
    var elapsed = now - this._lastRequestTime;
    if (elapsed < 1000) {
      return new Promise(function(resolve) {
        setTimeout(resolve, 1000 - elapsed);
      });
    }
    return Promise.resolve();
  },

  search: function(query) {
    var self = this;
    var url = 'https://nominatim.openstreetmap.org/search?format=json&q=' +
              encodeURIComponent(query) + '&limit=5&addressdetails=1';

    return this._throttle().then(function() {
      self._lastRequestTime = Date.now();
      return fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RouteCalculatorApp/1.0'
        }
      });
    })
    .then(function(response) {
      if (!response.ok) throw new Error('Geocoding failed: ' + response.status);
      return response.json();
    })
    .then(function(results) {
      return results.map(function(r) {
        return {
          displayName: r.display_name,
          lat: parseFloat(r.lat),
          lng: parseFloat(r.lon)
        };
      });
    });
  },

  reverse: function(lat, lng) {
    var self = this;
    var url = 'https://nominatim.openstreetmap.org/reverse?format=json&lat=' +
              lat + '&lon=' + lng + '&zoom=18';

    return this._throttle().then(function() {
      self._lastRequestTime = Date.now();
      return fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'RouteCalculatorApp/1.0'
        }
      });
    })
    .then(function(response) {
      if (!response.ok) throw new Error('Reverse geocoding failed: ' + response.status);
      return response.json();
    })
    .then(function(data) {
      return data.display_name || 'Unknown location';
    })
    .catch(function() {
      return 'Unknown location';
    });
  }
};
