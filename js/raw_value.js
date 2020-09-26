// set the dimensions and margins of the graph
var margin = {top: 20, right: 20, bottom: 50, left: 70},
width = 480*2 - margin.left - margin.right,
height = 250*2 - margin.top - margin.bottom;

// parse the date / time
// var parseTime = d3.timeParse("%d-%b-%y");

// set the ranges
var x_raw = d3.scaleLinear().range([0, width]);
var y_raw = d3.scaleLinear().range([height, 0]);


// append the svg obgect to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg_raw = d3.select("#raw_value").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.json("/data/raw_norm.json", function(error, data) {
if (error) throw error;
// format the data
data.forEach(function(d) {
  d.Time = +d.Time;
  d.Amplitude = +d.Amplitude;
});

// define the line
var valueline = d3.line()
.x(function(d) { return x_raw(d.Time); })
.y(function(d) { return y_raw(d.Amplitude); });



// Scale the range of the data
x_raw.domain(d3.extent(data, function(d) { return d.Time; }));
y_raw.domain(d3.extent(data, function(d) { return d.Amplitude; }));
//y.domain([0, d3.max(data, function(d) { return d.close; })]);

// Add the valueline path.
svg_raw.append("path")
  .data([data])
  .attr("class", "line")
  .attr("d", valueline);

// Add the X Axis
svg_raw.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x_raw));

svg_raw.append("text")             
  .attr("transform",
        "translate(" + (width/2) + " ," + 
               (height + margin.top + 20) + ")")
.style("text-anchor", "middle")
.text("Seconds");

// Add the Y Axis
svg_raw.append("g")
  .call(d3.axisLeft(y_raw));

svg_raw.append("text")
.attr("transform", "rotate(-90)")
.attr("y", 0 - margin.left)
.attr("x",0 - (height / 2))
.attr("dy", "1em")
.style("text-anchor", "middle")
.text("Normalized Amplitude");

});

var inter_raw = setInterval(function() {
  updateDataRaw();
}, 2000); 

// ** Update data section 
function updateDataRaw() {

  // Get the data again
  d3.json("/data/raw_norm.json", function(error, data) {
    if (error) throw error;
    // format the data
    data.forEach(function(d) {
      d.Time = +d.Time;
      d.Amplitude = +d.Amplitude;
    });

    var valueline = d3.line()
      .x(function(d) { return x_raw(d.Time); })
      .y(function(d) { return y_raw(d.Amplitude); });
      


    // Scale the range of the data again 
    x_raw.domain(d3.extent(data, function(d) { return d.Time; }));
    y_raw.domain(d3.extent(data, function(d) { return d.Amplitude; }));

  // Select the section we want to apply our changes to
  var svg_raw = d3.select("#raw_value").transition();


  // Make the changes
      svg_raw.select(".line")   // change the line
          .duration(750)
          .attr("d", valueline(data));
      svg_raw.select(".x.axis") // change the x axis
          .duration(750)
          .call(x_raw);
      svg_raw.select(".y.axis") // change the y axis
          .duration(750)
          .call(y_raw);

  });
}
