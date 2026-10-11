'use client';

// Singleton promise so the Maps JS API bootstrap loader is only injected once,
// no matter how many components call loadGoogleMaps().
let mapsPromise = null;

/**
 * Loads the Google Maps JavaScript API using Google's official "Dynamic
 * Library Import" bootstrap loader and resolves with the `google.maps`
 * namespace. Safe to call multiple times/from multiple components; the
 * underlying script is only ever requested once.
 *
 * See: https://developers.google.com/maps/documentation/javascript/load-maps-js-api
 */
export function loadGoogleMaps() {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Google Maps can only be loaded in the browser.'));
  }

  if (window.google?.maps?.importLibrary) {
    return Promise.resolve(window.google.maps);
  }

  if (mapsPromise) {
    return mapsPromise;
  }

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return Promise.reject(
      new Error('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable.'),
    );
  }

  mapsPromise = new Promise((resolve, reject) => {
    try {
      // Official Google Maps JS API bootstrap loader (dynamic library import).
      (g => {
        var h, a, k, p = 'The Google Maps JavaScript API', c = 'google', l = 'importLibrary', q = '__ib__', m = document, b = window;
        b = b[c] || (b[c] = {});
        var d = b.maps || (b.maps = {}), r = new Set(), e = new URLSearchParams(),
          u = () => h || (h = new Promise(async (f, n) => {
            await (a = m.createElement('script'));
            e.set('libraries', [...r] + '');
            for (k in g) e.set(k.replace(/[A-Z]/g, (t) => '_' + t[0].toLowerCase()), g[k]);
            e.set('callback', c + '.maps.' + q);
            a.src = `https://maps.${c}apis.com/maps/api/js?` + e;
            d[q] = f;
            a.onerror = () => (h = n(Error(p + ' could not load.')));
            a.nonce = m.querySelector('script[nonce]')?.nonce || '';
            m.head.append(a);
          }));
        d[l]
          ? console.warn(p + ' only loads once. Ignoring:', g)
          : (d[l] = (f, ...n) => r.add(f) && u().then(() => d[l](f, ...n)));
      })({ key: apiKey, v: 'weekly' });

      resolve(window.google.maps);
    } catch (error) {
      mapsPromise = null;
      reject(error);
    }
  });

  return mapsPromise;
}

/** Loads the "places" library (PlaceAutocompleteElement, Place, etc.). */
export function loadGooglePlacesLibrary() {
  return loadGoogleMaps().then((maps) => maps.importLibrary('places'));
}

/** Loads the "geocoding" library (Geocoder), used for reverse geocoding. */
export function loadGoogleGeocodingLibrary() {
  return loadGoogleMaps().then((maps) => maps.importLibrary('geocoding'));
}

/** Loads the "maps" library (Map, InfoWindow, etc.). */
export function loadGoogleMapsCoreLibrary() {
  return loadGoogleMaps().then((maps) => maps.importLibrary('maps'));
}

/** Loads the "marker" library (Marker, AdvancedMarkerElement). */
export function loadGoogleMarkerLibrary() {
  return loadGoogleMaps().then((maps) => maps.importLibrary('marker'));
}
