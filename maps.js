const token =
  "pk.eyJ1IjoibWF5YWNvbSIsImEiOiJjbDJqYzh5OWIwNTBqM2RudDE0MWF1c2VoIn0.1YIJP_8EBfod0CHcB19BNQ";
mapboxgl.accessToken = token;

const mapboxStyle =
  "mapbox://styles/mayacom/cl4dcvq6c000014nwivd2td2c?optimize=true";
const interactiveMapStyle =
  "mapbox://styles/mayacom/cl4h9leng000115p3ymlujlmt?optimize=true";
const isMobile = window.innerWidth < 768;
const southEastCoordinates = [-81.10368889887442, 32.00665653049841]; //[-85.242084, 34.256963];
const coordinatesObject = document.getElementById("coordinates");
const currentCoordinates = coordinatesObject
  ? JSON.parse(coordinatesObject.textContent).coordinates
  : null;
const currentId = coordinatesObject
  ? JSON.parse(coordinatesObject.textContent).id
  : null;
const maps = {
  heroMap: "hero-map",
  popInMap: "pop-in-map",
  placesMap: "places-map",
  portfolioMap: "portfolio-map",
};

const boundingLimit = (map) => {
  if (isMobile) {
    map.fitBounds([
      [-97.396378, 25.800583], // southwest corner of the bounds
      [-66.945392, 49.382808], // northeastern corner of the bounds
    ]);
  } else {
    map.fitBounds([
      [-124.736342, 24.521208], // southwestern corner of the bounds
      [-66.945392, 49.382808], // northeastern corner of the bounds
    ]);
  }
};

let object;
let event;
let popup = new mapboxgl.Popup({ closeButton: false, closeOnClick: true });
let activeItems = [];

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

// when pin is clicked, navigate to appropriate page
const clickPin = (map) => {
  map.on("click", "properties", (e) => {
    const link = e.features[0].properties.link;

    document.location.href = link;
  });
};

// update the popups
const updatePopup = (lagLat, html, map) => {
  // setHTML will be the innerHTML of the associated popup
  // all popups will be grabbing the HTML from the associated collection list
  popup.remove();

  if (popup.isOpen()) {
    popup.remove();
  } else {
    if (lagLat) {
      popup.setLngLat(lagLat).setHTML(html).addTo(map);
    }
  }
};

// set the cursor style
const setCursor = (map, style) => {
  // Change the cursor style as a UI indicator.
  map.getCanvas().style.cursor = style;
};

const green = "#79BC8D";
const white = "#F3EEE9";

const handleAddLayer = (theMap, id, source, circleRadius) => {
  theMap.addLayer({
    id: id,
    type: "circle",
    source: source,
    paint: {
      "circle-color": "#F3EEE9",
      "circle-radius": circleRadius,
      "circle-stroke-width": 2,
      "circle-stroke-color": white,
    },
  });
};

const handleSetPaintProperty = (theMap, featureId, color1, color2) => {
  // update color
  theMap.setPaintProperty("properties", "circle-color", [
    "match",
    ["get", "id"],
    featureId,
    color1,
    color2,
  ]);
  theMap.setPaintProperty("properties", "circle-stroke-color", [
    "match",
    ["get", "id"],
    featureId,
    color1,
    color2,
  ]);
};

// handle hero map
if (document.getElementById(maps.heroMap)) {
  const heroMap = new mapboxgl.Map({
    container: maps.heroMap,
    style: mapboxStyle,
    center: currentCoordinates,
    zoom: 8.5,
    doubleClickZoom: false,
    dragPan: false,
    scrollZoom: false,
  });

  heroMap.on("load", () => {
    const zoomInBtn = document.querySelector(".hero-map-toggle__zoom-in");
    const zoomOutBtn = document.querySelector(".hero-map-toggle__zoom-out");

    zoomInBtn.addEventListener("click", () => {
      heroMap.flyTo({
        center: currentCoordinates,
        zoom: 8.5,
      });
      zoomInBtn.style.display = "none";
      zoomOutBtn.style.display = "flex";
    });

    zoomOutBtn.addEventListener("click", () => {
      heroMap.flyTo({
        center: southEastCoordinates,
        zoom: isMobile ? 4 : 5, //5
      });
      zoomInBtn.style.display = "flex";
      zoomOutBtn.style.display = "none";
    });

    const location = setPinLocationsObject(
      "properties",
      ".property-popup__item",
      true
    );
    heroMap.addSource("properties", { type: "geojson", data: location });

    handleAddLayer(heroMap, "properties", "properties", isMobile ? 10 : 16);

    clickPin(heroMap);

    // set the active location marker to green
    handleSetPaintProperty(heroMap, currentId, green, white);

    heroMap.on("mouseenter", "properties", (e) => {
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

      updatePopup(coordinates, description, heroMap);

      let featureId = e.features[0].properties.id;
      handleSetPaintProperty(heroMap, featureId, green, white);
      handleSetPaintProperty(heroMap, currentId, green, white);
    });
    heroMap.on("mouseleave", "properties", () => {
      updatePopup();

      setCursor(heroMap, "default");

      let featureId = event.features[0].properties.id;
      handleSetPaintProperty(heroMap, featureId, white, white);
      handleSetPaintProperty(heroMap, currentId, green, white);
    });
  });
}

// handle pop-in map
if (document.getElementById(maps.popInMap) && !isMobile) {
  const popInMap = new mapboxgl.Map({
    container: maps.popInMap,
    style: mapboxStyle,
    center: southEastCoordinates,
    zoom: 3.45,
    minZoom: 3.45,
    maxZoom: 3.45,
    doubleClickZoom: false,
    dragPan: false,
    scrollZoom: false,
  });

  popInMap.on("load", () => {
    const location = setPinLocationsObject(
      "properties",
      ".property-popup__item",
      false
    );
    popInMap.addSource("properties", { type: "geojson", data: location });

    handleAddLayer(popInMap, "properties", "properties", 6);

    clickPin(popInMap);

    handleSetPaintProperty(popInMap, currentId, green, white);

    let domLink;

    popInMap.on("mouseenter", "properties", (e) => {
      event = e;

      domLink = document.querySelector(".pop-in-map__link");
      const linkText = e.features[0].properties.linkText;
      const link = e.features[0].properties.link;

      setCursor(popInMap, "pointer");

      domLink.textContent = linkText;
      domLink.href = link;

      let featureId = e.features[0].properties.id;
      handleSetPaintProperty(popInMap, featureId, green, white);
    });
    popInMap.on("mouseleave", "properties", () => {
      setCursor(popInMap, "default");

      let featureId = event.features[0].properties.id;
      handleSetPaintProperty(popInMap, featureId, white, white);
    });
  });
}

// handle portfolio map
if (document.getElementById(maps.portfolioMap)) {
  const portfolioMap = new mapboxgl.Map({
    container: maps.portfolioMap,
    style: mapboxStyle,
    center: [-81.10368889887442, 32.00665653049841],
    zoom: isMobile ? 5 : 4, //4,
    doubleClickZoom: false,
    dragPan: false,
    scrollZoom: false,
  });

  portfolioMap.on("load", () => {
    boundingLimit(portfolioMap);

    portfolioMap.touchZoomRotate.disable();

    const location = setPinLocationsObject(
      "properties",
      ".property-popup__item",
      true
    );
    portfolioMap.addSource("properties", {
      type: "geojson",
      data: location,
    });

    handleAddLayer(portfolioMap, "properties", "properties", 8);

    clickPin(portfolioMap);

    if (currentId) {
      handleSetPaintProperty(portfolioMap, currentId, green, white);
    }

    portfolioMap.on("mouseenter", "properties", (e) => {
      const coordinates = e.features[0].geometry.coordinates.slice();
      const description = e.features[0].properties.description;

      setCursor(portfolioMap, "pointer");

      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      updatePopup(coordinates, description, portfolioMap);

      let featureId = e.features[0].properties.id;
      handleSetPaintProperty(portfolioMap, featureId, green, white);
    });
    portfolioMap.on("mouseleave", "properties", () => {
      updatePopup();

      setCursor(portfolioMap, "default");

      let featureId = event.features[0].properties.id;
      handleSetPaintProperty(portfolioMap, featureId, white, white);
    });
  });
}
if (document.getElementById(maps.placesMap)) {
  const placesMap = new mapboxgl.Map({
    container: maps.placesMap,
    style: interactiveMapStyle,
    center: currentCoordinates,
    zoom: 12,
    minZoom: 11,
    maxZoom: 13,
    doubleClickZoom: false,
    dragPan: true,
    scrollZoom: true,
  });

  placesMap.on("load", () => {
    const places = setPinLocationsObject("places", ".places-popup__item", true);

    let listItems = document.querySelectorAll(".map-tabs-locations__item");
    listItems.forEach((item) => {
      const text = item.children[2].firstChild.textContent;
      item.setAttribute("id", text);
      let feature = places.features.filter((place) =>
        place.properties.slug.includes(text)
      );
      item.addEventListener("mouseenter", (e) => {
        handleHoverEvent({ features: [feature] });
      });
      item.addEventListener("mouseleave", (e) => {
        handleLeaveEvent();
      });
      item.addEventListener("click", () => {
        placesMap.flyTo({
          center: feature[0].geometry.coordinates,
          offset: [0, 100],
          speed: 1.5,
          curve: 0.3,
        });
      });
    });

    // Add a GeoJSON source
    placesMap.addSource("places", { type: "geojson", data: places });

    for (const feature of places.features) {
      let type = feature.properties.type;
      let layerID = `poi-${type}`;

      // Add a layer for this symbol type if it hasn't been added already.
      if (!placesMap.getLayer(layerID)) {
        let visibility = layerID === "poi-Neighborhood" ? "none" : "visible";

        placesMap.addLayer({
          id: layerID,
          type: "symbol",
          source: "places",
          minzoom: 11,
          maxzoom: 13,
          layout: {
            "icon-image": ["get", "icon"],
            "icon-allow-overlap": true,
            "icon-size": 0.75,
            visibility: visibility,
          },
          filter: ["==", "type", type],
        });
      }
    }

    const cityTab = document.querySelector("[data-w-tab='City']");
    const neighborhoodTab = document.querySelector(
      "[data-w-tab='Neighborhood']"
    );

    cityTab.addEventListener("click", () => {
      placesMap.setLayoutProperty("poi-Neighborhood", "visibility", "none");
      placesMap.setLayoutProperty("poi-City", "visibility", "visible");
      placesMap.jumpTo({
        center: currentCoordinates,
      });
    });
    neighborhoodTab.addEventListener("click", () => {
      placesMap.setLayoutProperty("poi-City", "visibility", "none");
      placesMap.setLayoutProperty("poi-Neighborhood", "visibility", "visible");
      placesMap.jumpTo({
        center: currentCoordinates,
      });
    });

    const toggleItemActiveClass = (items) => {
      items.forEach((item) => {
        item.classList.add("active");
      });

      if (activeItems.length && !activeItems.includes(items)) {
        items.forEach((item) => {
          item.classList.remove("active");
        });
      }
      activeItems = items;
    };

    /*const toggleItemActiveClass = (item) => {
      item.classList.add("active");
  
      if (activeItem && activeItem !== item) {
        item.classList.remove("active");
      }
      activeItem = item;
    };*/

    const handleHoverEvent = (e) => {
      let pinFeature = e.features[0];
      let listFeature = e.features[0][0];

      // when hovering over a marker
      if (pinFeature && !listFeature) {
        const coordinates = pinFeature.geometry.coordinates.slice();
        const description = pinFeature.properties.description;

        setCursor(placesMap, "pointer");

        let {
          properties: { name, type, icon, slug },
        } = pinFeature;

        updatePopup(coordinates, description, placesMap);

        // hightlist the list item
        let items = [...document.querySelectorAll(`[id^='${slug}'`)];
        toggleItemActiveClass(items);

        // update the icon
        placesMap.setLayoutProperty(`poi-${type}`, "icon-image", [
          "match",
          ["get", "name"],
          `${name}`,
          `${icon}-hover`,
          ["get", "icon"],
        ]);
        // when hovering over a list item
      } else if (pinFeature && listFeature) {
        const coordinates = listFeature.geometry.coordinates.slice();
        const description = listFeature.properties.description;

        let {
          properties: { name, type, icon, slug },
        } = listFeature;

        updatePopup(coordinates, description, placesMap);

        // hightlist the marker(s)
        let items = [...document.querySelectorAll(`[id^='${slug}'`)];
        toggleItemActiveClass(items);

        // update the icon
        placesMap.setLayoutProperty(`poi-${type}`, "icon-image", [
          "match",
          ["get", "name"],
          `${name}`,
          `${icon}-hover`,
          ["get", "icon"],
        ]);
      }
    };
    const handleLeaveEvent = (e) => {
      setCursor(placesMap, "");
      updatePopup();

      if (activeItems.length) {
        activeItems.forEach((item) => {
          item.classList.remove("active");
        });
      }

      placesMap.setLayoutProperty("poi-City", "icon-image", ["get", "icon"]);
      placesMap.setLayoutProperty("poi-Neighborhood", "icon-image", [
        "get",
        "icon",
      ]);
    };
    placesMap.on("mouseenter", "poi-City", handleHoverEvent);
    placesMap.on("mouseenter", "poi-Neighborhood", handleHoverEvent);

    placesMap.on("mouseleave", "poi-City", handleLeaveEvent);
    placesMap.on("mouseleave", "poi-Neighborhood", handleLeaveEvent);
  });
}
