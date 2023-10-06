// Get the canvas element and context for the chart
const barchart = document.getElementById('providerStateChart').getContext('2d');

// Specify the URL where your JSON data is hosted
const dataUrl = "http://127.0.0.1:5000/bestNS"; // Your JSON data URL

// Function to fetch JSON data from a URL and create the chart
async function fetchJsonDataAndCreateChart(url) {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error('fix bug');
        }
        const jsonData = await response.json();
        
        const stateCounts = jsonData.reduce((counts, item) => {
            const state = item["Provider State"];
            counts[state] = (counts[state] || 0) + 1;
            return counts;
        }, {});

        const labels = Object.keys(stateCounts);
        const data = Object.values(stateCounts);
        
        new Chart(barchart, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [{
              label: 'Numbers of 5 Stars rating by State',
              data: data,
              backgroundColor: 'rgba(75, 192, 192, 0.2)', // Adjust the color as needed
              borderColor: 'rgba(75, 192, 192, 1)', // Adjust the color as needed
              borderWidth: 1        
            }]
          },
          options: { // Use "options" instead of "scales"
            scales: {
              y: {
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Total numbers of 5 stars nursing homes'      
                }
              },
              x: {
                title: {
                  display: true,
                  text: 'State'
                }
              }
            }
          }
        });
        
    } catch (error) {
        console.error('Error:', error); //de bug 
    }
}

// Fetch JSON data and create the chart
fetchJsonDataAndCreateChart(dataUrl);

const Url = "http://127.0.0.1:5000/mappingjson";

// Create an object to map state abbreviations to full state names data not clean
const stateAbbreviationToName = {
  "AL": "Alabama",
  "AK": "Alaska",
  "AZ": "Arizona",
  "AR": "Arkansas",
  "CA": "California",
  "CO": "Colorado",
  "CT": "Connecticut",
  "DE": "Delaware",
  "FL": "Florida",
  "GA": "Georgia",
  "HI": "Hawaii",
  "ID": "Idaho",
  "IL": "Illinois",
  "IN": "Indiana",
  "IA": "Iowa",
  "KS": "Kansas",
  "KY": "Kentucky",
  "LA": "Louisiana",
  "ME": "Maine",
  "MD": "Maryland",
  "MA": "Massachusetts",
  "MI": "Michigan",
  "MN": "Minnesota",
  "MS": "Mississippi",
  "MO": "Missouri",
  "MT": "Montana",
  "NE": "Nebraska",
  "NV": "Nevada",
  "NH": "New Hampshire",
  "NJ": "New Jersey",
  "NM": "New Mexico",
  "NY": "New York",
  "NC": "North Carolina",
  "ND": "North Dakota",
  "OH": "Ohio",
  "OK": "Oklahoma",
  "OR": "Oregon",
  "PA": "Pennsylvania",
  "RI": "Rhode Island",
  "SC": "South Carolina",
  "SD": "South Dakota",
  "TN": "Tennessee",
  "TX": "Texas",
  "UT": "Utah",
  "VT": "Vermont",
  "VA": "Virginia",
  "WA": "Washington",
  "WV": "West Virginia",
  "WI": "Wisconsin",
  "WY": "Wyoming"
};

const stateProviderCounts = {};

// Create an object to store the state-wise provider names
const stateProviderNames = {};

// Create a Leaflet map centered on the US
const map = L.map('map').setView([37.8, -96], 4);

// Add a base map layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// Define a color scale
const colorScale = d3.scaleLinear()
  .domain([0, 8]) // Adjust the domain as needed
  .range([
    "blue",
    "red",
    "white"
  ]);
// Fetch the data from the specified URL
fetch(Url)
  .then(response => response.json())
  .then(jsonData => {
    // Calculate the state-wise provider counts and names from the fetched data
    jsonData.forEach(entry => {
      const stateAbbreviation = entry["Provider State"];
      const stateName = stateAbbreviationToName[stateAbbreviation] || stateAbbreviation;
      stateProviderCounts[stateName] = (stateProviderCounts[stateName] || 0) + 1;
      stateProviderNames[stateName] = entry["Provider Name"];
    });

    // Calculate the total number of providers
    const totalProviders = jsonData.length;

    // Calculate the percentages for each state
    const statePercentages = {};
    for (const stateName in stateProviderCounts) {
      const providerCount = stateProviderCounts[stateName];
      const percentage = (providerCount / totalProviders) * 100;
      statePercentages[stateName] = percentage.toFixed(2); // Round to 2 decimal places
    }

    // Load the GeoJSON file for US states
    fetch('/static/DatasetManipulations/gz_2010_us_040_00_20m.json')
      .then(response => response.json())
      .then(usStatesGeoJSON => {
        // Add the percentages and provider count as properties to the GeoJSON features
        usStatesGeoJSON.features.forEach(feature => {
          const stateName = feature.properties.NAME; // Using the "NAME" property from GeoJSON
          const percentage = statePercentages[stateName] || 0;
          feature.properties.ProviderPercentage = percentage;
          feature.properties.ProviderCount = stateProviderCounts[stateName] || 0;
          feature.properties.ProviderName = stateProviderNames[stateName] || "";
        });

        // Add the GeoJSON layer to the map
        L.geoJson(usStatesGeoJSON, {
          style: function (feature) {
            const percentage = feature.properties.ProviderPercentage;
            return {
              fillColor: colorScale(percentage),
              fillOpacity: 0.7,
              color: 'white',
              weight: 2
            };
          },
          onEachFeature: function (feature, layer) {
            const stateName = feature.properties.NAME;
            const percentage = feature.properties.ProviderPercentage;
            const providerCount = feature.properties.ProviderCount;
            const popupContent = `State: ${stateName}<br>Provider Percentage: ${percentage}%<br>Total Providers: ${providerCount}`;
            layer.bindPopup(popupContent);
          }
        }).addTo(map);
      });
  });