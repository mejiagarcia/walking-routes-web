window.RouteApp = window.RouteApp || {};

window.RouteApp.Map = {
  _map: null,
  _origin: null,
  _destination: null,
  _waypoints: [],
  _routePolylines: [],
  _originMarker: null,
  _destinationMarker: null,
  _waypointMarkers: [],
  _routeResult: null,

  _originIcon: null,
  _destinationIcon: null,

  init: function(containerId) {
    var self = this;

    this._originIcon = L.icon({
      iconUrl: 'assets/marker-a.svg',
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      popupAnchor: [0, -40]
    });

    this._destinationIcon = L.icon({
      iconUrl: 'assets/marker-b.svg',
      iconSize: [30, 40],
      iconAnchor: [15, 40],
      popupAnchor: [0, -40]
    });

    this._map = L.map(containerId, {
      zoomControl: true
    }).setView([41.3874, 2.1686], 13);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(this._map);

    // Try to center on user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function(position) {
          self._map.setView([position.coords.latitude, position.coords.longitude], 15);
        },
        function() { /* keep fallback view */ },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }

    this._map.on('click', function(e) {
      self.onMapClick(e);
    });
  },

  onMapClick: function(e) {
    var lat = e.latlng.lat;
    var lng = e.latlng.lng;

    if (!this._origin) {
      this.setMarker('origin', lat, lng);
      RouteApp.Geocoding.reverse(lat, lng).then(function(name) {
        var input = document.getElementById('origin-input');
        if (input) input.value = name;
      });
    } else if (!this._destination) {
      this.setMarker('destination', lat, lng);
      RouteApp.Geocoding.reverse(lat, lng).then(function(name) {
        var input = document.getElementById('destination-input');
        if (input) input.value = name;
      });
      this._autoCalculate();
    } else {
      this.setMarker('destination', lat, lng);
      RouteApp.Geocoding.reverse(lat, lng).then(function(name) {
        var input = document.getElementById('destination-input');
        if (input) input.value = name;
      });
      this._autoCalculate();
    }
  },

  _autoCalculate: function() {
    if (this._origin && this._destination) {
      var btn = document.getElementById('btn-calculate');
      if (btn) btn.click();
    }
  },

  setMarker: function(type, lat, lng) {
    var self = this;

    if (type === 'origin') {
      if (this._originMarker) {
        this._originMarker.setLatLng([lat, lng]);
      } else {
        this._originMarker = L.marker([lat, lng], {
          icon: this._originIcon,
          draggable: true
        }).addTo(this._map);

        this._originMarker.on('dragend', function(e) {
          var pos = e.target.getLatLng();
          self._origin = { lat: pos.lat, lng: pos.lng };
          RouteApp.Geocoding.reverse(pos.lat, pos.lng).then(function(name) {
            var input = document.getElementById('origin-input');
            if (input) input.value = name;
          });
          self._autoCalculate();
        });
      }
      this._origin = { lat: lat, lng: lng };

    } else if (type === 'destination') {
      if (this._destinationMarker) {
        this._destinationMarker.setLatLng([lat, lng]);
      } else {
        this._destinationMarker = L.marker([lat, lng], {
          icon: this._destinationIcon,
          draggable: true
        }).addTo(this._map);

        this._destinationMarker.on('dragend', function(e) {
          var pos = e.target.getLatLng();
          self._destination = { lat: pos.lat, lng: pos.lng };
          RouteApp.Geocoding.reverse(pos.lat, pos.lng).then(function(name) {
            var input = document.getElementById('destination-input');
            if (input) input.value = name;
          });
          self._autoCalculate();
        });
      }
      this._destination = { lat: lat, lng: lng };
    }
  },

  _createWaypointIcon: function(number) {
    return L.divIcon({
      className: 'waypoint-marker-icon',
      html: '<div class="waypoint-marker">' + number + '</div>',
      iconSize: [26, 26],
      iconAnchor: [13, 13]
    });
  },

  addWaypoint: function(lat, lng) {
    var self = this;
    var index = this._waypoints.length;

    var marker = L.marker([lat, lng], {
      icon: this._createWaypointIcon(index + 1),
      draggable: true
    }).addTo(this._map);

    var waypointData = { lat: lat, lng: lng, marker: marker };
    this._waypoints.push(waypointData);

    marker.on('dragend', function(e) {
      var pos = e.target.getLatLng();
      waypointData.lat = pos.lat;
      waypointData.lng = pos.lng;
      var wpInputs = document.querySelectorAll('.waypoint-input');
      if (wpInputs[index]) {
        RouteApp.Geocoding.reverse(pos.lat, pos.lng).then(function(name) {
          wpInputs[index].value = name;
        });
      }
      self._autoCalculate();
    });

    return index;
  },

  removeWaypoint: function(index) {
    if (index >= 0 && index < this._waypoints.length) {
      var wp = this._waypoints[index];
      if (wp.marker) {
        this._map.removeLayer(wp.marker);
      }
      this._waypoints.splice(index, 1);
      this._renumberWaypoints();
      this._autoCalculate();
    }
  },

  _renumberWaypoints: function() {
    for (var i = 0; i < this._waypoints.length; i++) {
      this._waypoints[i].marker.setIcon(this._createWaypointIcon(i + 1));
    }
  },

  getWaypoints: function() {
    return this._waypoints.map(function(wp) {
      return { lat: wp.lat, lng: wp.lng };
    });
  },

  drawRoutes: function(routeResult) {
    var self = this;
    this.clearRoute();
    this._routeResult = routeResult;

    routeResult.routes.forEach(function(route, i) {
      var isSelected = (i === routeResult.selectedIndex);
      var polyline = L.polyline(route.coordinates, {
        color: isSelected ? '#5B8DEF' : '#C0C6CC',
        weight: isSelected ? 5 : 3,
        opacity: isSelected ? 0.85 : 0.45,
        dashArray: isSelected ? null : '8, 12',
        className: 'route-polyline route-' + i
      }).addTo(self._map);

      polyline._routeIndex = i;

      if (!isSelected) {
        polyline.on('click', function() {
          self.selectRoute(i);
        });
      }

      self._routePolylines.push(polyline);
    });

    var selected = routeResult.routes[routeResult.selectedIndex];
    if (selected && selected.coordinates.length > 0) {
      this._map.fitBounds(L.latLngBounds(selected.coordinates), {
        padding: [50, 50]
      });
    }
  },

  selectRoute: function(index) {
    var self = this;
    if (!this._routeResult) return;
    this._routeResult.selectedIndex = index;

    this._routePolylines.forEach(function(polyline) {
      var i = polyline._routeIndex;
      var isSelected = (i === index);

      polyline.setStyle({
        color: isSelected ? '#5B8DEF' : '#C0C6CC',
        weight: isSelected ? 5 : 3,
        opacity: isSelected ? 0.85 : 0.45,
        dashArray: isSelected ? null : '8, 12'
      });

      if (isSelected) {
        polyline.bringToFront();
        polyline.off('click');
      } else {
        polyline.off('click');
        polyline.on('click', function() {
          self.selectRoute(i);
        });
      }
    });

    if (RouteApp.UI && RouteApp.UI.updateRouteDisplay) {
      RouteApp.UI.updateRouteDisplay(this._routeResult);
    }
  },

  clearRoute: function() {
    var self = this;
    this._routePolylines.forEach(function(polyline) {
      self._map.removeLayer(polyline);
    });
    this._routePolylines = [];
    this._routeResult = null;
  },

  clearAll: function() {
    this.clearRoute();

    if (this._originMarker) {
      this._map.removeLayer(this._originMarker);
      this._originMarker = null;
    }
    if (this._destinationMarker) {
      this._map.removeLayer(this._destinationMarker);
      this._destinationMarker = null;
    }

    var self = this;
    this._waypointMarkers.forEach(function(m) {
      self._map.removeLayer(m);
    });
    this._waypoints.forEach(function(wp) {
      if (wp.marker) self._map.removeLayer(wp.marker);
    });

    this._origin = null;
    this._destination = null;
    this._waypoints = [];
    this._waypointMarkers = [];
  },

  getOrigin: function() {
    return this._origin;
  },

  getDestination: function() {
    return this._destination;
  }
};
