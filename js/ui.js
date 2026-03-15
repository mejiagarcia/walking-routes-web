window.RouteApp = window.RouteApp || {};

window.RouteApp.UI = {
  _elements: {},
  _waypointCount: 0,
  _maxWaypoints: 5,

  init: function() {
    this._cacheElements();
    this._bindEvents();
  },

  _cacheElements: function() {
    this._elements = {
      originInput: document.getElementById('origin-input'),
      destinationInput: document.getElementById('destination-input'),
      btnMyLocation: document.getElementById('btn-my-location'),
      btnCalculate: document.getElementById('btn-calculate'),
      btnClear: document.getElementById('btn-clear'),
      btnAddStop: document.getElementById('btn-add-stop'),
      routeSummary: document.getElementById('route-summary'),
      routeDistance: document.getElementById('route-distance'),
      routeDuration: document.getElementById('route-duration'),
      routeSteps: document.getElementById('route-steps-count'),
      routeCalories: document.getElementById('route-calories'),
      routeAlternatives: document.getElementById('route-alternatives'),
      routeInstructions: document.getElementById('route-instructions'),
      waypointsContainer: document.getElementById('waypoints-container'),
      searchResultsOrigin: document.getElementById('search-results-origin'),
      searchResultsDestination: document.getElementById('search-results-destination'),
      loadingIndicator: document.getElementById('loading-indicator'),
      errorMessage: document.getElementById('error-message')
    };
  },

  _bindEvents: function() {
    var self = this;
    var Utils = RouteApp.Utils;

    // Origin input search
    var debouncedOriginSearch = Utils.debounce(function(e) {
      self._handleSearch(e.target.value, 'origin');
    }, 300);
    this._elements.originInput.addEventListener('input', debouncedOriginSearch);

    // Destination input search
    var debouncedDestSearch = Utils.debounce(function(e) {
      self._handleSearch(e.target.value, 'destination');
    }, 300);
    this._elements.destinationInput.addEventListener('input', debouncedDestSearch);

    // My location button
    this._elements.btnMyLocation.addEventListener('click', function() {
      self._handleMyLocation();
    });

    // Calculate button
    this._elements.btnCalculate.addEventListener('click', function() {
      self._handleCalculate();
    });

    // Clear button
    this._elements.btnClear.addEventListener('click', function() {
      self._handleClear();
    });

    // Add stop button
    this._elements.btnAddStop.addEventListener('click', function() {
      self._addWaypointInput();
    });

    // Keyboard support
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        self._hideAllDropdowns();
      }
      if (e.key === 'Enter' && (e.target === self._elements.originInput || e.target === self._elements.destinationInput || e.target.classList.contains('waypoint-input'))) {
        self._hideAllDropdowns();
        if (RouteApp.Map.getOrigin() && RouteApp.Map.getDestination()) {
          self._handleCalculate();
        }
      }
    });

    // Close dropdowns on outside click
    document.addEventListener('click', function(e) {
      if (!e.target.closest('.input-wrapper')) {
        self._hideAllDropdowns();
      }
    });
  },

  _handleSearch: function(query, type) {
    var self = this;
    if (query.length < 3) {
      this._hideDropdown(type);
      return;
    }

    RouteApp.Geocoding.search(query).then(function(results) {
      self._showDropdown(type, results);
    }).catch(function(err) {
      console.error('Search error:', err);
    });
  },

  _showDropdown: function(type, results) {
    var self = this;
    var dropdown;

    if (type === 'origin') {
      dropdown = this._elements.searchResultsOrigin;
    } else if (type === 'destination') {
      dropdown = this._elements.searchResultsDestination;
    } else {
      dropdown = document.getElementById('search-results-waypoint-' + type);
    }

    if (!dropdown) return;
    dropdown.innerHTML = '';

    if (results.length === 0) {
      dropdown.classList.remove('visible');
      return;
    }

    results.forEach(function(result) {
      var item = document.createElement('div');
      item.className = 'search-result-item';
      item.textContent = result.displayName;
      item.addEventListener('click', function() {
        self._selectResult(type, result);
        dropdown.classList.remove('visible');
      });
      dropdown.appendChild(item);
    });

    dropdown.classList.add('visible');
  },

  _hideDropdown: function(type) {
    var dropdown;
    if (type === 'origin') {
      dropdown = this._elements.searchResultsOrigin;
    } else if (type === 'destination') {
      dropdown = this._elements.searchResultsDestination;
    } else {
      dropdown = document.getElementById('search-results-waypoint-' + type);
    }
    if (dropdown) dropdown.classList.remove('visible');
  },

  _hideAllDropdowns: function() {
    var dropdowns = document.querySelectorAll('.search-results');
    dropdowns.forEach(function(d) { d.classList.remove('visible'); });
  },

  _selectResult: function(type, result) {
    if (type === 'origin') {
      this._elements.originInput.value = result.displayName;
      RouteApp.Map.setMarker('origin', result.lat, result.lng);
    } else if (type === 'destination') {
      this._elements.destinationInput.value = result.displayName;
      RouteApp.Map.setMarker('destination', result.lat, result.lng);
    } else {
      // waypoint index
      var wpInput = document.querySelector('#waypoint-row-' + type + ' .waypoint-input');
      if (wpInput) wpInput.value = result.displayName;
      var wpIndex = parseInt(type, 10);
      if (wpIndex < RouteApp.Map._waypoints.length) {
        var wp = RouteApp.Map._waypoints[wpIndex];
        wp.lat = result.lat;
        wp.lng = result.lng;
        wp.marker.setLatLng([result.lat, result.lng]);
      } else {
        RouteApp.Map.addWaypoint(result.lat, result.lng);
      }
    }

    if (RouteApp.Map.getOrigin() && RouteApp.Map.getDestination()) {
      this._handleCalculate();
    }
  },

  _handleMyLocation: function() {
    var self = this;
    if (!navigator.geolocation) {
      this._showError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      function(position) {
        var lat = position.coords.latitude;
        var lng = position.coords.longitude;
        RouteApp.Map.setMarker('origin', lat, lng);
        RouteApp.Map._map.setView([lat, lng], 15);
        RouteApp.Geocoding.reverse(lat, lng).then(function(name) {
          self._elements.originInput.value = name;
        });
      },
      function(error) {
        var msg = 'Location unavailable.';
        if (error.code === 1) msg = 'Location access denied.';
        self._showError(msg);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  },

  _addWaypointInput: function() {
    if (this._waypointCount >= this._maxWaypoints) return;

    var self = this;
    var index = this._waypointCount;
    this._waypointCount++;

    var row = document.createElement('div');
    row.className = 'waypoint-row';
    row.id = 'waypoint-row-' + index;

    var inputWrapper = document.createElement('div');
    inputWrapper.className = 'input-wrapper waypoint-input-wrapper';

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'waypoint-input';
    input.placeholder = 'Stop ' + (index + 1);
    input.setAttribute('autocomplete', 'off');

    var dropdown = document.createElement('div');
    dropdown.className = 'search-results';
    dropdown.id = 'search-results-waypoint-' + index;

    var removeBtn = document.createElement('button');
    removeBtn.className = 'btn-remove-waypoint';
    removeBtn.innerHTML = '&times;';
    removeBtn.title = 'Remove stop';
    removeBtn.setAttribute('data-index', index);

    var debouncedSearch = RouteApp.Utils.debounce(function() {
      self._handleSearch(input.value, '' + index);
    }, 300);
    input.addEventListener('input', debouncedSearch);

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        self._hideAllDropdowns();
        if (RouteApp.Map.getOrigin() && RouteApp.Map.getDestination()) {
          self._handleCalculate();
        }
      }
    });

    removeBtn.addEventListener('click', function() {
      var idx = parseInt(this.getAttribute('data-index'), 10);
      self._removeWaypointInput(idx, row);
    });

    inputWrapper.appendChild(input);
    inputWrapper.appendChild(dropdown);
    row.appendChild(inputWrapper);
    row.appendChild(removeBtn);

    this._elements.waypointsContainer.appendChild(row);

    if (this._waypointCount >= this._maxWaypoints) {
      this._elements.btnAddStop.classList.add('disabled');
    }
  },

  _removeWaypointInput: function(index, rowElement) {
    rowElement.remove();
    RouteApp.Map.removeWaypoint(index);
    this._waypointCount--;

    if (this._waypointCount < this._maxWaypoints) {
      this._elements.btnAddStop.classList.remove('disabled');
    }

    // Re-index remaining waypoint rows
    var rows = this._elements.waypointsContainer.querySelectorAll('.waypoint-row');
    for (var i = 0; i < rows.length; i++) {
      rows[i].id = 'waypoint-row-' + i;
      var input = rows[i].querySelector('.waypoint-input');
      if (input) input.placeholder = 'Stop ' + (i + 1);
      var btn = rows[i].querySelector('.btn-remove-waypoint');
      if (btn) btn.setAttribute('data-index', i);
      var dd = rows[i].querySelector('.search-results');
      if (dd) dd.id = 'search-results-waypoint-' + i;
    }
  },

  _handleCalculate: function() {
    var self = this;
    var origin = RouteApp.Map.getOrigin();
    var destination = RouteApp.Map.getDestination();

    if (!origin || !destination) {
      this._showError('Please set both origin and destination.');
      return;
    }

    var waypoints = RouteApp.Map.getWaypoints();

    this._showLoading(true);
    this._hideError();

    RouteApp.Routing.calculateRoute(
      origin.lat, origin.lng,
      destination.lat, destination.lng,
      waypoints
    ).then(function(result) {
      self._showLoading(false);
      RouteApp.Map.drawRoutes(result);
      self.updateRouteDisplay(result);
    }).catch(function(err) {
      self._showLoading(false);
      console.error('Routing error:', err);

      // Show Haversine fallback
      var Utils = RouteApp.Utils;
      var straightLine = Utils.haversine(origin.lat, origin.lng, destination.lat, destination.lng);
      self._showError(err.message + ' Straight-line distance: ' + straightLine.toFixed(1) + ' km');
    });
  },

  updateRouteDisplay: function(routeResult) {
    var Utils = RouteApp.Utils;
    var route = routeResult.routes[routeResult.selectedIndex];
    if (!route) return;

    // Update summary
    this._elements.routeDistance.textContent = Utils.formatDistance(route.distance);
    this._elements.routeDuration.textContent = Utils.formatDuration(route.duration);
    this._elements.routeSteps.textContent = Math.round(route.distance / 0.75).toLocaleString();
    this._elements.routeCalories.textContent = Math.round((route.distance / 1000) * 60);

    this._elements.routeSummary.classList.remove('hidden');

    // Render alternatives
    this._renderAlternatives(routeResult);

    // Render instructions
    this._renderInstructions(route.steps);
  },

  _renderAlternatives: function(routeResult) {
    var self = this;
    var container = this._elements.routeAlternatives;
    container.innerHTML = '';

    if (routeResult.routes.length <= 1) {
      container.classList.add('hidden');
      return;
    }

    container.classList.remove('hidden');
    var Utils = RouteApp.Utils;

    routeResult.routes.forEach(function(route, i) {
      var card = document.createElement('div');
      card.className = 'route-card' + (i === routeResult.selectedIndex ? ' active' : '');

      var title = document.createElement('div');
      title.className = 'route-card-title';
      title.textContent = 'Route ' + (i + 1);

      var details = document.createElement('div');
      details.className = 'route-card-details';
      details.textContent = Utils.formatDistance(route.distance) + ' \u00B7 ' + Utils.formatDuration(route.duration);

      card.appendChild(title);
      card.appendChild(details);

      card.addEventListener('click', function() {
        RouteApp.Map.selectRoute(i);
        // Update active card styles
        container.querySelectorAll('.route-card').forEach(function(c) { c.classList.remove('active'); });
        card.classList.add('active');
      });

      container.appendChild(card);
    });
  },

  _renderInstructions: function(steps) {
    var container = this._elements.routeInstructions;
    container.innerHTML = '';
    var Utils = RouteApp.Utils;

    steps.forEach(function(step) {
      var div = document.createElement('div');
      div.className = 'instruction-step';

      var icon = document.createElement('span');
      icon.className = 'instruction-icon';
      icon.textContent = step.icon;

      var text = document.createElement('div');
      text.className = 'instruction-text';

      var main = document.createElement('span');
      main.className = 'instruction-main';
      main.textContent = step.instruction;

      var dist = document.createElement('span');
      dist.className = 'instruction-distance';
      dist.textContent = Utils.formatDistance(step.distance);

      text.appendChild(main);
      text.appendChild(dist);
      div.appendChild(icon);
      div.appendChild(text);
      container.appendChild(div);
    });
  },

  _showLoading: function(show) {
    if (show) {
      this._elements.loadingIndicator.classList.add('visible');
    } else {
      this._elements.loadingIndicator.classList.remove('visible');
    }
  },

  _showError: function(message) {
    var el = this._elements.errorMessage;
    el.textContent = message;
    el.classList.add('visible');

    clearTimeout(this._errorTimer);
    this._errorTimer = setTimeout(function() {
      el.classList.remove('visible');
    }, 5000);
  },

  _hideError: function() {
    this._elements.errorMessage.classList.remove('visible');
    clearTimeout(this._errorTimer);
  },

  _handleClear: function() {
    RouteApp.Map.clearAll();
    this._elements.originInput.value = '';
    this._elements.destinationInput.value = '';
    this._elements.waypointsContainer.innerHTML = '';
    this._waypointCount = 0;
    this._elements.btnAddStop.classList.remove('disabled');
    this._elements.routeSummary.classList.add('hidden');
    this._elements.routeAlternatives.classList.add('hidden');
    this._elements.routeAlternatives.innerHTML = '';
    this._elements.routeInstructions.innerHTML = '';
    this._hideAllDropdowns();
    this._hideError();
  }
};
