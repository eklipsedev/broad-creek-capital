const token =
  "pk.eyJ1IjoibWF5YWNvbSIsImEiOiJjbDJqYzh5OWIwNTBqM2RudDE0MWF1c2VoIn0.1YIJP_8EBfod0CHcB19BNQ";
mapboxgl.accessToken = token;

const mapboxStyle = "mapbox://styles/mayacom/cl4dcvq6c000014nwivd2td2c";
const southEastCoordinates = [-81.10368889887442, 32.00665653049841];
const currentCoordinates = JSON.parse(
  document.getElementById("coordinates").textContent
).coordinates;

const mapImage = `https://api.mapbox.com/styles/v1/mayacom/cl4dcvq6c000014nwivd2td2c/static/${currentCoordinates},${8}/1280x1280?access_token=${token}`;

const heroMap = new mapboxgl.Map({
  container: "hero-map",
  style: mapboxStyle,
  center: currentCoordinates,
  zoom: 8,
  doubleClickZoom: false,
  dragPan: false,
  scrollZoom: false
});
const popInMap = new mapboxgl.Map({
  container: "pop-in-map",
  style: mapboxStyle,
  center: southEastCoordinates,
  zoom: 3.45,
  doubleClickZoom: false,
  dragPan: false,
  scrollZoom: false
});
const placesMap = new mapboxgl.Map({
  container: "places-map",
  style: "mapbox://styles/mayacom/cl4h9leng000115p3ymlujlmt",
  center: [-81.10368889887442, 32.00665653049841], // not using
  zoom: 12, //12
  doubleClickZoom: true,
  dragPan: false,
  scrollZoom: false
});
const portfolioMap = new mapboxgl.Map({
  container: "portfolio-map",
  style: mapboxStyle,
  center: [-81.10368889887442, 32.00665653049841],
  zoom: 4,
  doubleClickZoom: false,
  dragPan: false,
  scrollZoom: false
});

let object;
let event;
let popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: true });
let activeItem;

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

const updatePopup = (lagLat, html, map) => {
  // setHTML will be the innerHTML of the associated popup
  // all popups will be grabbing the HTML from the associated collection list
  popup.remove();

  if (popup.isOpen()) {
    popup.remove();
  } else {
    popup.setLngLat(lagLat).setHTML(html).addTo(map);
  }
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
heroMap.on("load", () => {
  const zoomInBtn = document.querySelector(".hero-map-toggle__zoom-in");
  const zoomOutBtn = document.querySelector(".hero-map-toggle__zoom-out");

  zoomInBtn.addEventListener("click", () => {
    heroMap.flyTo({
      center: currentCoordinates,
      zoom: 8
    });
    zoomInBtn.style.display = "none";
    zoomOutBtn.style.display = "flex";
  });

  zoomOutBtn.addEventListener("click", () => {
    heroMap.flyTo({
      center: southEastCoordinates,
      zoom: 5.25
    });
    zoomInBtn.style.display = "flex";
    zoomOutBtn.style.display = "none";
  });

  const location = setPinLocationsObject(
    "properties",
    ".property-popup__item",
    true
  );
  console.log(location);
  heroMap.addSource("properties", { type: "geojson", data: location });

  handleAddLayer(heroMap, "properties", "properties", 24);

  heroMap.on("mouseenter", "properties", (e) => {
    console.log("hero map hovered");
    event = e;

    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = e.features[0].properties.description;

    setCursor(heroMap, "pointer");

    // Ensure that if the map is zoomed out such that multiple
    // copies of the feature are visible, the popup appears
    // over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    popup.setLngLat(coordinates).setHTML(description).addTo(heroMap);

    let featureId = e.features[0].properties.id;
    handleSetPaintProperty(heroMap, featureId, green, white);
  });
  heroMap.on("mouseleave", "properties", () => {
    popup.remove();

    setCursor(heroMap, "default");

    let featureId = event.features[0].properties.id;
    handleSetPaintProperty(heroMap, featureId, white, white);
  });
});

// handle pop-in map
popInMap.on("load", () => {
  const location = setPinLocationsObject(
    "properties",
    ".property-popup__item",
    false
  );
  popInMap.addSource("properties", { type: "geojson", data: location });

  handleAddLayer(popInMap, "properties", "properties", 6);

  popInMap.on("click", "properties", (e) => {
    const link = e.features[0].properties.link;

    document.location.href = link;
  });

  let domLink;

  popInMap.on("mouseenter", "properties", (e) => {
    event = e;

    domLink = document.querySelector(".pop-in-map__link");
    const linkText = e.features[0].properties.linkText;
    const link = e.features[0].properties.link;

    // this is some fake text

    setCursor(popInMap, "pointer");

    domLink.textContent = linkText;
    domLink.href = link;

    let featureId = e.features[0].properties.id;
    handleSetPaintProperty(popInMap, featureId, green, white);
  });
  popInMap.on("mouseleave", "properties", () => {
    setCursor(heroMap, "default");

    let featureId = event.features[0].properties.id;
    handleSetPaintProperty(popInMap, featureId, white, white);
  });
});

// handle portfolio map
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
  portfolioMap.addSource("properties", {
    type: "geojson",
    data: location
  });

  handleAddLayer(portfolioMap, "properties", "properties", 12);

  portfolioMap.on("mouseenter", "properties", (e) => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const description = e.features[0].properties.description;

    setCursor(portfolioMap, "pointer");

    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    popup.setLngLat(coordinates).setHTML(description).addTo(portfolioMap);

    let featureId = e.features[0].properties.id;
    handleSetPaintProperty(portfolioMap, featureId, green, white);
  });
  portfolioMap.on("mouseleave", "properties", () => {
    popup.remove();

    setCursor(heroMap, "default");

    let featureId = event.features[0].properties.id;
    handleSetPaintProperty(portfolioMap, featureId, white, white);
  });
});

placesMap.on("load", () => {
  console.log("loaded");
  const location = setPinLocationsObject(
    "properties",
    ".places-popup__item",
    true
  );

  let listItems = document.querySelectorAll(".map-tabs-locations__item");
  listItems.forEach((item) => {
    item.addEventListener("mouseenter", (e) => {
      let feature = location.features.find(
        (place) => place.properties.name === item.id
      );
      handleHoverEvent({ features: [feature] }, placesMap);
    });
    item.addEventListener("mouseleave", (e) => {
      handleLeaveEvent(e, placesMap);
    });
  });

  placesMap.addSource("places", { type: "geojson", data: location });
  console.log(location.features);

  for (const feature of location.features) {
    let type = feature.properties.type;
    let layerID = `poi-${type}`;

    // Add a layer for this symbol type if it hasn't been added already.
    if (!placesMap.getLayer(layerID)) {
      let visibility = layerID == "poi-Neighborhood" ? "none" : "visible";

      placesMap.addLayer({
        id: layerID,
        type: "symbol",
        source: "places",
        layout: {
          "icon-image": ["get", "icon"], //["get", "feature.properties.icon"],
          "icon-allow-overlap": true,
          visibility: visibility
        },
        filter: ["==", "type", type]
      });
    }
  }
  // cant get here
  console.log("here");

  const cityTab = document.querySelector("[data-w-tab='City']");
  const neighborhoodTab = document.querySelector("[data-w-tab='Neighborhood']");
  console.log(cityTab);

  cityTab.addEventListener("click", () => {
    placesMap.setLayoutProperty("poi-Neighborhood", "visibility", "none");
    placesMap.setLayoutProperty("poi-City", "visibility", "visible");
  });
  neighborhoodTab.addEventListener("click", () => {
    placesMap.setLayoutProperty("poi-City", "visibility", "none");
    placesMap.setLayoutProperty("poi-Neighborhood", "visibility", "visible");
  });

  placesMap.on("mouseenter", "poi-City", (e) => {
    console.log("hovered!");
    handleHoverEvent(e);
  });
  placesMap.on("mouseenter", "poi-Neighborhood", (e) => {
    console.log("hovered!");
    handleHoverEvent(e);
  });
  placesMap.on("mouseenter", "poi-City", (e) => {
    handleLeaveEvent(e);
  });
  placesMap.on("mouseenter", "poi-Neighborhood", (e) => {
    handleLeaveEvent(e);
  });

  function handleHoverEvent(e) {
    placesMap.getCanvas().style.cursor = "pointer";

    if (e.features[0]) {
      let feature = e.features[0];
      let {
        properties: { name, type, icon }
      } = feature;
      updatePopup(feature.geometry.coordinates, popup, placesMap);

      // hightlist the list item
      let item = document.getElementById(name);
      toggleItemActiveClass(item);

      // update the icon
      placesMap.setLayoutProperty(`poi-${type}`, "icon-image", [
        "match",
        ["get", "name"],
        `${name}`,
        `${icon}-Hover`,
        ["get", "icon"]
      ]);
    }
  }
  function handleLeaveEvent(e) {
    placesMap.getCanvas().style.cursor = "";

    popup.remove();

    /*if (activeItem) {
      activeItem.classList.remove("active");
    }*/

    placesMap.setLayoutProperty("poi-City", "icon-image", ["get", "icon"]);
    placesMap.setLayoutProperty("poi-Neighborhood", "icon-image", [
      "get",
      "icon"
    ]);

    // reset the image
  }
  function toggleItemActiveClass(item) {
    item.classList.add("active");
    if (activeItem && activeItem !== item) {
      activeItem.classList.remove("active");
    }
    activeItem = item;
  }
});
