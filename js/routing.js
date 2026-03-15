window.RouteApp = window.RouteApp || {};

window.RouteApp.Routing = {

  _valhallaUrl: 'https://valhalla1.openstreetmap.de/route',

  calculateRoute: function(originLat, originLng, destLat, destLng, waypoints) {
    var Utils = RouteApp.Utils;
    var self = this;

    var locations = [{ lat: originLat, lon: originLng }];

    if (waypoints && waypoints.length > 0) {
      for (var i = 0; i < waypoints.length; i++) {
        locations.push({ lat: waypoints[i].lat, lon: waypoints[i].lng });
      }
    }

    locations.push({ lat: destLat, lon: destLng });

    var body = {
      locations: locations,
      costing: 'pedestrian',
      directions_options: { units: 'kilometers', language: RouteApp.I18n ? RouteApp.I18n.valhallaLang() : 'en-US' },
      alternates: 2
    };

    return fetch(this._valhallaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(body)
    })
    .then(function(response) {
      if (!response.ok) {
        return response.json().then(function(err) {
          throw new Error(err.error || 'Routing failed: ' + response.status);
        });
      }
      return response.json();
    })
    .then(function(data) {
      var allTrips = [data.trip];

      if (data.alternates) {
        data.alternates.forEach(function(alt) {
          if (alt.trip) allTrips.push(alt.trip);
        });
      }

      var routes = allTrips.map(function(trip, index) {
        var coordinates = [];
        var steps = [];
        var totalDistance = 0;
        var totalDuration = 0;

        trip.legs.forEach(function(leg) {
          // Valhalla uses precision 6 for encoded polyline
          var legCoords = Utils.decodePolyline(leg.shape, 6);
          coordinates = coordinates.concat(legCoords);

          if (leg.maneuvers) {
            leg.maneuvers.forEach(function(maneuver) {
              steps.push({
                instruction: maneuver.instruction,
                distance: maneuver.length * 1000, // km to meters
                duration: maneuver.time,
                icon: Utils.getManeuverIcon(maneuver.type)
              });
            });
          }

          totalDistance += leg.summary.length * 1000; // km to meters
          totalDuration += leg.summary.time;
        });

        return {
          coordinates: coordinates,
          distance: totalDistance,
          duration: totalDuration,
          isMain: index === 0,
          steps: steps
        };
      });

      return {
        routes: routes,
        selectedIndex: 0
      };
    });
  }
};
