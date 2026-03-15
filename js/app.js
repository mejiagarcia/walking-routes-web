window.RouteApp = window.RouteApp || {};

document.addEventListener('DOMContentLoaded', function() {
  // Initialize Lucide icons
  if (window.lucide) {
    window.lucide.createIcons();
  }

  // Initialize i18n (detects browser language or restores saved preference)
  RouteApp.I18n.init();

  // Bind language switcher buttons
  document.querySelectorAll('[data-lang]').forEach(function(btn) {
    btn.addEventListener('click', function() {
      RouteApp.I18n.setLanguage(btn.getAttribute('data-lang'));
    });
  });

  RouteApp.Map.init('map-container');
  RouteApp.UI.init();

  // Try to restore last route; if none, center on user location
  var restored = RouteApp.UI.restoreLastRoute();
  if (!restored) {
    RouteApp.Map.centerOnUserLocation();
  }
});
