window.RouteApp = window.RouteApp || {};

document.addEventListener('DOMContentLoaded', function() {
  RouteApp.Map.init('map-container');
  RouteApp.UI.init();

  // Try to restore last route; if none, center on user location
  var restored = RouteApp.UI.restoreLastRoute();
  if (!restored) {
    RouteApp.Map.centerOnUserLocation();
  }
});
