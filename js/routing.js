window.RouteApp = window.RouteApp || {};

window.RouteApp.Routing = {

  calculateRoute: function(originLat, originLng, destLat, destLng, waypoints) {
    var Utils = RouteApp.Utils;
    var coords = originLng + ',' + originLat;

    if (waypoints && waypoints.length > 0) {
      for (var i = 0; i < waypoints.length; i++) {
        coords += ';' + waypoints[i].lng + ',' + waypoints[i].lat;
      }
    }

    coords += ';' + destLng + ',' + destLat;

    var hasWaypoints = waypoints && waypoints.length > 0;
    var url = 'https://router.project-osrm.org/route/v1/foot/' + coords +
              '?overview=full&geometries=polyline&steps=true&annotations=true' +
              (hasWaypoints ? '' : '&alternatives=3');

    return fetch(url, {
      headers: { 'Accept': 'application/json' }
    })
    .then(function(response) {
      if (!response.ok) {
        throw new Error('Network error: ' + response.status);
      }
      return response.json();
    })
    .then(function(data) {
      if (data.code !== 'Ok') {
        throw new Error(data.message || 'No route found between these points. Try a nearby road — OSRM may not support this area for pedestrian routing.');
      }

      var routes = data.routes.map(function(route, index) {
        var coordinates = Utils.decodePolyline(route.geometry);
        var steps = [];

        if (route.legs) {
          route.legs.forEach(function(leg) {
            if (leg.steps) {
              leg.steps.forEach(function(step) {
                steps.push({
                  instruction: Utils.formatInstruction(step),
                  distance: step.distance,
                  duration: step.duration,
                  maneuver: step.maneuver,
                  name: step.name,
                  icon: Utils.getManeuverIcon(step.maneuver.type, step.maneuver.modifier)
                });
              });
            }
          });
        }

        // OSRM public server returns car-speed durations even for foot profile.
        // Override with realistic walking duration: 5 km/h = 83.33 m/min
        var walkingSpeed = 83.33; // meters per minute
        var walkingDuration = (route.distance / walkingSpeed) * 60; // seconds

        // Also fix per-step durations proportionally
        var osrmTotal = route.duration || 1;
        steps.forEach(function(s) {
          s.duration = (s.distance / walkingSpeed) * 60;
        });

        return {
          coordinates: coordinates,
          distance: route.distance,
          duration: walkingDuration,
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
