mapboxgl.accessToken =
  "pk.eyJ1IjoibWF5YWNvbSIsImEiOiJjbDJqYzh5OWIwNTBqM2RudDE0MWF1c2VoIn0.1YIJP_8EBfod0CHcB19BNQ";
const portfolioMap = new mapboxgl.Map({
  container: "portfolio-map",
  style: "mapbox://styles/mayacom/cl4dcvq6c000014nwivd2td2c",
  center: [-96.6401018485296, 38.746331896552284],
  zoom: 3.85,
  doubleClickZoom: false,
  dragPan: false,
  scrollZoom: false
});

let object;
let event;
let popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: true });

// dynamic set locations for properties & places
const setPinLocationsObject = (object, itemClass, hasPopup) => {
  object = {};
  object.type = "FeatureCollection";
  object.features = [];

  const items = document.querySelectorAll(itemClass);
  items.forEach((item) => {
    let data = JSON.parse(item.getElementsByTagName("script")[0].textContent);
    if (hasPopup) {
      data.properties.description = item.children[0].outerHTML;
    }
    object.features.push(data);
  });
  return object;
};

const setCursor = (map, style) => {
  // Change the cursor style as a UI indicator.
  map.getCanvas().style.cursor = style;
};

const handleAddLayer = (theMap, id, source, circleRadius) => {
  theMap.addLayer({
    id: id,
    type: "circle",
    source: source,
    paint: {
      "circle-color": "#F3EEE9",
      "circle-radius": circleRadius,
      "circle-stroke-width": 2,
      "circle-stroke-color": "#F3EEE9"
    }
  });
};

const green = "#79BC8D";
const white = "#F3EEE9";
console.log(white);

const handleSetPaintProperty = (theMap, featureId, color1, color2) => {
  // update color
  theMap.setPaintProperty("properties", "circle-color", [
    "match",
    ["get", "id"],
    featureId,
    color1,
    color2
  ]);
  theMap.setPaintProperty("properties", "circle-stroke-color", [
    "match",
    ["get", "id"],
    featureId,
    color1,
    color2
  ]);
};

// handle hero map
portfolioMap.on("load", () => {
  portfolioMap.fitBounds([
    [-124.736342, 24.521208], // southwestern corner of the bounds
    [-66.945392, 49.382808] // northeastern corner of the bounds
  ]);
  portfolioMap.touchZoomRotate.disable();

  const location = setPinLocationsObject(
    "properties",
    ".property-popup__item",
    true
  );
  portfolioMap.addSource("properties", { type: "geojson", data: location });
  handleAddLayer(portfolioMap, "properties", "properties", 8);

  console.log(portfolioMap.on("mouseenter", "properties"));
  portfolioMap.on("mouseenter", "properties", (e) => {
    console.log(portfolioMap);
    event = e;

    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = e.features[0].properties.description;

    setCursor(portfolioMap, "pointer");

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    popup.setLngLat(coordinates).setHTML(description).addTo(portfolioMap);

    let featureId = e.features[0].properties.id;
    handleSetPaintProperty(portfolioMap, featureId, green, white);
  });
  portfolioMap.on("mouseleave", "properties", () => {
    popup.remove();

    setCursor(portfolioMap, "default");

    let featureId = event.features[0].properties.id;
    handleSetPaintProperty(portfolioMap, featureId, white, white);
  });
});
