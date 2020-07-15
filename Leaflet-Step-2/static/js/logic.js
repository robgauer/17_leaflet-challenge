// Leaflet Homework - Leaflet Challenge
// Leaflet-Challenge
// Author:  Rob Gauer
// Date Due:  July 14, 2020
//----------------------------------------------------
// Reference README.md for Instructions for Objective.
// File Name:  logic.js
//----------------------------------------------------
//
// variables for API endpoints
let earthquakeURL = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson";

let faultLinesURL = "https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json";

// Calls function to render map
renderMap(earthquakeURL, faultLinesURL);

// Function to render map
function renderMap(earthquakeURL, faultLinesURL) {

  // Performs GET request for the earthquake URL
  d3.json(earthquakeURL, function(data) {
    console.log(earthquakeURL)
    // Stores response into earthquakeData
    let earthquakeData = data;
    // Performs GET request for the fault lines URL
    d3.json(faultLinesURL, function(data) {
      // Stores response into faultLineData
      let faultLineData = data;

      // Passes data into createFeatures function
      createFeatures(earthquakeData, faultLineData);
    });
  });

  // Function to create features
  function createFeatures(earthquakeData, faultLineData) {

    // Defines two functions that are run once for each feature in earthquakeData
    // Creates markers for each earthquake and adds a popup describing place, time, and magnitude
    function onEachQuakeLayer(feature, layer) {
      return new L.circleMarker([feature.geometry.coordinates[1], 
        feature.geometry.coordinates[0]], {
        fillOpacity: 1,
        color: chooseColor(feature.properties.mag),
        fillColor: chooseColor(feature.properties.mag),
        radius:  markerSize(feature.properties.mag)
      });
    }
    function onEachEarthquake(feature, layer) {
      layer.bindPopup("<h3>" + 
      feature.properties.place + "</h3><hr><p>" + 
      new Date(feature.properties.time) + "</p><hr><p>Magnitude: " + 
      feature.properties.mag + "</p>"
      );
    }

    // Defines a function that is run once for each feature in faultLineData
    // Create fault lines
    function onEachFaultLine(feature, layer) {
      L.polyline(feature.geometry.coordinates);
    }

    // Creates a GeoJSON layer containing the features array of the earthquakeData object
    // Run the onEachEarthquake & onEachQuakeLayer functions once for element in array
    let earthquakes = L.geoJSON(earthquakeData, {
      onEachFeature: onEachEarthquake,
      pointToLayer: onEachQuakeLayer
    });

    // Creates a GeoJSON layer containing the features array of the faultLineData object
    // Run onEachFaultLine function once for element in array
    let faultLines = L.geoJSON(faultLineData, {
      onEachFeature: onEachFaultLine,
      style: {
        weight: 2,
        color: 'darkorange'
      }
    });

    // Creates a Timeline layer containing the features array of the earthquakeData object
    // Run getInterval function to get the time interval for each earthquake (length based on magnitude)
    // Run the onEachEarthquake & onEachQuakeLayer functions once for each element in the array
    let timelineLayer = L.timeline(earthquakeData, {
      getInterval: function(feature) {
        return {
          start: feature.properties.time,
          end: feature.properties.time + 
          feature.properties.mag * 10000000
        };
      },
      pointToLayer: onEachQuakeLayer,
      onEachFeature: onEachEarthquake
    });

    // Sends earthquakes, fault lines and timeline layers to the createMap function
    createMap(earthquakes, faultLines, timelineLayer);
  }

  // Function to create map
  function createMap(earthquakes, faultLines, timelineLayer) {
    // Define outdoors, satellite, and darkmap layers
    // Outdoors layer
    let outdoors = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/outdoors-v10/tiles/256/{z}/{x}/{y}?" +
        "access_token=pk.eyJ1Ijoicm9iZ2F1ZXIiLCJhIjoiY2tjNWcxbzkyMDU2ZDM0bGZqNXB0cXluMiJ9.Qvb6bHq_MO3tnGUa3kkhSw");
      // Satellite layer
    let satellite = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/256/{z}/{x}/{y}?" +
        "access_token=pk.eyJ1Ijoicm9iZ2F1ZXIiLCJhIjoiY2tjNWcxbzkyMDU2ZDM0bGZqNXB0cXluMiJ9.Qvb6bHq_MO3tnGUa3kkhSw");
      // Darkmap layer
    let darkmap = L.tileLayer("https://api.mapbox.com/styles/v1/mapbox/dark-v9/tiles/256/{z}/{x}/{y}?" +
        "access_token=pk.eyJ1Ijoicm9iZ2F1ZXIiLCJhIjoiY2tjNWcxbzkyMDU2ZDM0bGZqNXB0cXluMiJ9.Qvb6bHq_MO3tnGUa3kkhSw");

    // Define a baseMaps object to hold base layers
    let baseMaps = {
      "Outdoors Map": outdoors,
      "Satellite Map": satellite,
      "Dark Map": darkmap,
    };

    // Create overlay object to hold overlay layers
    let overlayMaps = {
      "Earthquakes": earthquakes,
      "Fault Lines": faultLines
    };

    // Create map, default settings: outdoors and faultLines layers display
    let map = L.map("map", {
      center: [39.8283, -98.5785],
      zoom: 2,
      layers: [outdoors, faultLines],
      scrollWheelZoom: true
    });

    // Create a layer control
    // Pass in baseMaps and overlayMaps
    // Add the layer control to map
    L.control.layers(baseMaps, overlayMaps, {
      collapsed: false
    }).addTo(map);

    // Adds Legend
    let legend = L.control({position: 'bottomright'});
    legend.onAdd = function(map) {
      let div = L.DomUtil.create('div', 'info legend'),
        grades = [0, 1, 2, 3, 4, 5],
        labels = ["0-1", "1-2", "2-3", "3-4", "4-5", "5+"];

      for (let i = 0; i < grades.length; i++) {
        div.innerHTML += '<i style="background:' + chooseColor(grades[i] + 1) + '"></i> ' +
                grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
      }

      return div;
    };
    legend.addTo(map);

    // Adds timeline controls
    let timelineControl = L.timelineSliderControl({
      formatOutput: function(date) {
        return new Date(date).toString();
      }
    });
    timelineControl.addTo(map);
    timelineControl.addTimelines(timelineLayer);
    timelineLayer.addTo(map);
  }
}

// chooseColor function:
// Returns color for each grade
function chooseColor(magnitude) {
  return magnitude > 5 ? "red":
  magnitude > 4 ? "orange":
  magnitude > 3 ? "yellow":
  magnitude > 2 ? "lime":
  magnitude > 1 ? "green":
  "blue"; // <= 1 default
}

// Function to amplify circle size by earthquake magnitude
function markerSize(magnitude) {
  return magnitude * 5;
}

// EOF