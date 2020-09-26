 // set the dimensions and margins of the graph
 var margin = {top: 20, right: 20, bottom: 50, left: 70},
 width = 960 - margin.left - margin.right,
 height = 500 - margin.top - margin.bottom;

// parse the date / time
// var parseTime = d3.timeParse("%d-%b-%y");

// set the ranges
var x_welch = d3.scaleLinear().range([0, width]);
var y_welch = d3.scaleLinear().range([height, 0]);


// append the svg obgect to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg_welch = d3.select("#welch_value").append("svg")
 .attr("width", width + margin.left + margin.right)
 .attr("height", height + margin.top + margin.bottom)
 .append("g")
 .attr("transform",
       "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.json("/data/welch_value.json", function(error, data) {
if (error) throw error;

// format the data
data.forEach(function(d) {
   d.Frequency = +d.Frequency;
   d.Power = +d.Power;
});

// define the line
var valueline = d3.line()
 .curve(d3.curveBasis)
 .x(function(d) { return x_welch(d.Frequency); })
 .y(function(d) { return y_welch(d.Power); });


// Scale the range of the data
x_welch.domain(d3.extent(data, function(d) { return d.Frequency; }));
y_welch.domain(d3.extent(data, function(d) { return d.Power; }));
//y.domain([0, d3.max(data, function(d) { return d.close; })]);

// Add the valueline path.
svg_welch.append("path")
   .data([data])
   .attr("class", "line_fill")
   .attr("d", valueline);

// Add the X Axis
svg_welch.append("g")
   .attr("transform", "translate(0," + height + ")")
   .call(d3.axisBottom(x_welch));

svg_welch.append("text")             
   .attr("transform",
         "translate(" + (width/2) + " ," + 
                (height + margin.top + 20) + ")")
 .style("text-anchor", "middle")
 .text("Frequency (Hz)");

// Add the Y Axis
svg_welch.append("g")
   .call(d3.axisLeft(y_welch));

svg_welch.append("text")
 .attr("transform", "rotate(-90)")
 .attr("y", 0 - margin.left)
 .attr("x",0 - (height / 2))
 .attr("dy", "1em")
 .style("text-anchor", "middle")
 .text("Power");

});

var inter_welch = setInterval(function() {
   updateDataWelch();
   updateSpectogramAdd();
 }, 2000); 

 function updateSpectogramAdd(){
       $("#spect_img").attr('src', 'data/spectrogram.png' + '?' + Math.random());

       };

 // ** Update data section 
 function updateDataWelch() {
 
   // Get the data again
   d3.json("/data/welch_value.json", function(error, data) {
     if (error) throw error;
     // format the data
         data.forEach(function(d) {
            d.Frequency = +d.Frequency;
            d.Power = +d.Power;
         });
 
     // define the line
   var valueline = d3.line()
      .curve(d3.curveBasis)
      .x(function(d) { return x_welch(d.Frequency); })
      .y(function(d) { return y_welch(d.Power); });
   
 
     // Scale the range of the data again 
     // Scale the range of the data
         x_welch.domain(d3.extent(data, function(d) { return d.Frequency; }));
         y_welch.domain(d3.extent(data, function(d) { return d.Power; }));
   // Select the section we want to apply our changes to
   var svg_welch = d3.select("#welch_value").transition();
 
 
   // Make the changes
       svg_welch.select(".line_fill")   // change the line
           .duration(750)
           .attr("d", valueline(data));
       svg_welch.select(".x.axis") // change the x axis
           .duration(750)
           .call(x_welch);
       svg_welch.select(".y.axis") // change the y axis
           .duration(750)
           .call(y_welch);
 
   });
 }
 
