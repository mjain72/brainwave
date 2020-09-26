// set the dimensions and margins of the graph
var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

// set the ranges
var x_band = d3.scaleBand()
          .range([0, width])
          .padding(0.1);
var y_band = d3.scaleLinear()
          .range([height, 0]);
          
// append the svg_bands object to the body of the page
// append a 'group' element to 'svg_bands'
// moves the 'group' element to the top left margin
var svg_bands = d3.select("#band_value").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
  .append("g")
    .attr("transform", 
          "translate(" + margin.left + "," + margin.top + ")");

// get the data
d3.json("/data/band_strength.json", function(error, data) {
  if (error) throw error;

  // format the data
  data.forEach(function(d) {
    d.Normalized_AUC = +d.Normalized_AUC;
  });
  console.log(data);

  // Scale the range of the data in the domains
  x_band.domain(data.map(function(d) { return d.Band; }));
  y_band.domain([0.0, d3.max(data, function(d){return d.Normalized_AUC}) + 0.1]);

  var color = d3.scaleOrdinal(d3.schemeCategory20c) 


  // append the rectangles for the bar chart
  svg_bands.selectAll(".bar")
      .data(data)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x_band(d.Band); })
      .attr("width", x_band.bandwidth())
      .attr("y", function(d) { return y_band(d.Normalized_AUC); })
      .attr("height", function(d) { return height - y_band(d.Normalized_AUC); })
      .attr("fill", function(d, i) { return color(i); });

  // add the x Axis
  h = height+0.5;
  svg_bands.append("g")
      .attr("transform", "translate(0," + h + ")")
      .call(d3.axisBottom(x_band));

  // add the y Axis
  //svg_bands.append("g")
    //  .call(d3.axisLeft(y_band));

});

var inter_band = setInterval(function() {
  updateDataBand();
}, 2000); 

// ** Update data section 
function updateDataBand() {
  
  // Get the data again
  d3.json("/data/band_strength.json", function(error, data) {
    if (error) throw error;
    // format the data
    data.forEach(function(d) {
      d.Normalized_AUC = +d.Normalized_AUC;
    });
    var bars = svg_bands.selectAll(".bar").remove().exit().data(data);
    x_band.domain(data.map(function(d) { return d.Band; }));
    y_band.domain([0.0, d3.max(data, function(d){return d.Normalized_AUC})]);

      

      var color = d3.scaleOrdinal(d3.schemeCategory20c) 

      bars.enter()
      .append("rect")
      .attr("class", "bar")
      .attr("x", function(d) { return x_band(d.Band); })
      .attr("width", x_band.bandwidth())
      .attr("y", function(d) { return y_band(d.Normalized_AUC); })
      .attr("height", function(d) { return height - y_band(d.Normalized_AUC); })
      .attr("fill", function(d, i) { return color(i); });
  

    // Scale the range of the data again 
    // Scale the range of the data
      // Scale the range of the data in the domains
 

  // Select the section we want to apply our changes to
  
 // append the rectangles for the bar chart
   

  // Make the changes
      svg_bands.select(".x.axis") // change the x axis
          .call(x_band);
     // svg_bands.select(".y.axis") // change the y axis
         // .call(y_band);

  });
}


