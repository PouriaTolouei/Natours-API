/* eslint-disable */

import mapboxgl from 'mapbox-gl';

/**
 * Displays a map bounded based on the given locations which are also marked on the map.
 * @param locations: An array of longitude, latitude pairs
 */
export const displayMap = (locations) => {
  // Creates a map
  mapboxgl.accessToken =
    'pk.eyJ1IjoicG91cmlhdG9sb3VlaSIsImEiOiJjbWdiaGo4NjgxM2RjMmpvY3dmOGlqMjFjIn0.w_APS-Dp7Vuu0imyNfLU9w';
  const map = new mapboxgl.Map({
    container: 'map',
    style: 'mapbox://styles/pouriatolouei/cmgbkgjxn002b01sn2ekgbs7l',
    scrollZoom: false,
  });

  // Creates bounds
  const bounds = new mapboxgl.LngLatBounds();

  // Goes through each locations
  locations.forEach((loc) => {
    // Creates a marker
    const el = document.createElement('div');
    el.className = 'marker';

    // Adds the marker
    new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat(loc.coordinates)
      .addTo(map);

    // Adds popup
    new mapboxgl.Popup({
      offset: 30,
      focusAfterOpen: false,
    })
      .setLngLat(loc.coordinates)
      .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
      .addTo(map);

    // Extends the map bound to include the current location
    bounds.extend(loc.coordinates);
  });

  // Applies the bounds to the map
  map.fitBounds(bounds, {
    padding: {
      top: 250,
      bottom: 150,
      left: 100,
      right: 100,
    },
  });
};
