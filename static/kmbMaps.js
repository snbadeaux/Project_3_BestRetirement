const url = '/static/DatasetManipulations/truncated_nursing_df2.json'


function createMap(data) {
    console.log(data)
    console.log(data['Federal Provider Number'])
    // let street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    //     attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    // })
  
    // let myMap = L.map("map", {
    //   center: [
    //     37.09, -95.71
    //   ],
    //   zoom: 5,
    //   layers: [street]
    // });

    // // Create and add the markers to the map
    // createMarkers(data, myMap);

    // // Create and the markers to the map
    // createLegend(myMap);
  }

d3.json(url).then(createMap);