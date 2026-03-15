window.RouteApp = window.RouteApp || {};

window.RouteApp.I18n = {
  _lang: 'en',

  _valhallaLangs: {
    en: 'en-US',
    es: 'es-ES',
    ca: 'ca'
  },

  _translations: {
    en: {
      origin: 'Origin',
      destination: 'Destination',
      stop: 'Stop',
      addStop: 'Add stop',
      calculate: 'Calculate Route',
      clear: 'Clear',
      lastRoute: 'Last route',
      aboutTitle: 'About WalkRoute',
      aboutDesc: 'A free, privacy-first pedestrian router. No API keys, no billing, no tracking.',
      walkingTime: 'walking time',
      distance: 'Distance',
      steps: 'Steps',
      cal: 'Cal',
      route: 'Route',
      locationDenied: 'Location access denied.',
      locationUnavailable: 'Location unavailable.',
      noGeolocation: 'Geolocation is not supported by your browser.',
      setBothPoints: 'Please set both origin and destination.',
      straightLine: 'Straight-line:',
      featPaths: 'Real pedestrian paths',
      featPathsDesc: 'sidewalks, footpaths, parks via Valhalla routing',
      featMetrics: 'Walking metrics',
      featMetricsDesc: 'steps and calories, not just distance',
      featMultistop: 'Multi-stop',
      featMultistopDesc: 'up to 5 intermediate stops',
      featAlt: 'Alternatives',
      featAltDesc: 'compare up to 3 walking paths',
      featClient: '100% client-side',
      featClientDesc: 'no server, no accounts',
      featWorld: 'Worldwide',
      featWorldDesc: 'works anywhere OpenStreetMap has data'
    },
    es: {
      origin: 'Origen',
      destination: 'Destino',
      stop: 'Parada',
      addStop: 'Añadir parada',
      calculate: 'Calcular ruta',
      clear: 'Borrar',
      lastRoute: 'Última ruta',
      aboutTitle: 'Sobre WalkRoute',
      aboutDesc: 'Un enrutador peatonal gratuito y privado. Sin claves API, sin facturación, sin rastreo.',
      walkingTime: 'tiempo caminando',
      distance: 'Distancia',
      steps: 'Pasos',
      cal: 'Cal',
      route: 'Ruta',
      locationDenied: 'Acceso a la ubicación denegado.',
      locationUnavailable: 'Ubicación no disponible.',
      noGeolocation: 'Tu navegador no soporta geolocalización.',
      setBothPoints: 'Por favor establece el origen y el destino.',
      straightLine: 'Línea recta:',
      featPaths: 'Rutas peatonales reales',
      featPathsDesc: 'aceras, caminos y parques vía Valhalla',
      featMetrics: 'Métricas de caminata',
      featMetricsDesc: 'pasos y calorías, no solo distancia',
      featMultistop: 'Múltiples paradas',
      featMultistopDesc: 'hasta 5 paradas intermedias',
      featAlt: 'Alternativas',
      featAltDesc: 'compara hasta 3 rutas peatonales',
      featClient: '100% en el navegador',
      featClientDesc: 'sin servidor, sin cuentas',
      featWorld: 'Global',
      featWorldDesc: 'funciona donde OpenStreetMap tenga datos'
    },
    ca: {
      origin: 'Origen',
      destination: 'Destinació',
      stop: 'Parada',
      addStop: 'Afegir parada',
      calculate: 'Calcular ruta',
      clear: 'Esborrar',
      lastRoute: 'Última ruta',
      aboutTitle: 'Sobre WalkRoute',
      aboutDesc: 'Un enrutador per a vianants gratuït i privat. Sense claus API, sense facturació, sense seguiment.',
      walkingTime: 'temps caminant',
      distance: 'Distància',
      steps: 'Passos',
      cal: 'Cal',
      route: 'Ruta',
      locationDenied: 'Accés a la ubicació denegat.',
      locationUnavailable: 'Ubicació no disponible.',
      noGeolocation: 'El teu navegador no suporta geolocalització.',
      setBothPoints: "Si us plau, estableix l'origen i la destinació.",
      straightLine: 'Línia recta:',
      featPaths: 'Rutes peatonals reals',
      featPathsDesc: 'voreres, camins i parcs via Valhalla',
      featMetrics: 'Mètriques de caminada',
      featMetricsDesc: 'passos i calories, no sols distància',
      featMultistop: 'Múltiples parades',
      featMultistopDesc: 'fins a 5 parades intermèdies',
      featAlt: 'Alternatives',
      featAltDesc: 'compara fins a 3 rutes peatonals',
      featClient: '100% al navegador',
      featClientDesc: 'sense servidor, sense comptes',
      featWorld: 'Global',
      featWorldDesc: 'funciona on OpenStreetMap tingui dades'
    }
  },

  init: function() {
    var saved = null;
    try { saved = localStorage.getItem('walkroute_lang'); } catch (e) {}

    if (saved && this._translations[saved]) {
      this._lang = saved;
    } else {
      var browser = (navigator.language || 'en').toLowerCase();
      if (browser.indexOf('ca') === 0) {
        this._lang = 'ca';
      } else if (browser.indexOf('es') === 0) {
        this._lang = 'es';
      } else {
        this._lang = 'en';
      }
    }

    this.apply();
  },

  t: function(key) {
    var trans = this._translations[this._lang] || this._translations.en;
    return trans[key] !== undefined ? trans[key] : (this._translations.en[key] || key);
  },

  valhallaLang: function() {
    return this._valhallaLangs[this._lang] || 'en-US';
  },

  setLanguage: function(lang) {
    if (!this._translations[lang]) return;
    this._lang = lang;
    try { localStorage.setItem('walkroute_lang', lang); } catch (e) {}
    this.apply();
  },

  apply: function() {
    var self = this;

    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      el.textContent = self.t(el.getAttribute('data-i18n'));
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      el.placeholder = self.t(el.getAttribute('data-i18n-placeholder'));
    });

    // Update waypoint placeholders
    document.querySelectorAll('.waypoint-input').forEach(function(el, i) {
      el.placeholder = self.t('stop') + ' ' + (i + 1);
    });

    // Sync active lang button
    document.querySelectorAll('[data-lang]').forEach(function(btn) {
      btn.classList.toggle('active', btn.getAttribute('data-lang') === self._lang);
    });
  }
};
