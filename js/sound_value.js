// set the dimensions and margins of the graph
var margin = {top: 20, right: 20, bottom: 50, left: 70},
width = 960 - margin.left - margin.right,
height = 500 - margin.top - margin.bottom;

// parse the date / time
// var parseTime = d3.timeParse("%d-%b-%y");

// set the ranges
var x_sound = d3.scaleLinear().range([0, width]);
var y_sound = d3.scaleLinear().range([height, 0]);


// append the svg obgect to the body of the page
// appends a 'group' element to 'svg'
// moves the 'group' element to the top left margin
var svg_sound = d3.select("#sound_value").append("svg")
.attr("width", width + margin.left + margin.right)
.attr("height", height + margin.top + margin.bottom)
.append("g")
.attr("transform",
      "translate(" + margin.left + "," + margin.top + ")");

// Get the data
d3.json("/data/sound_wave_sound_visual.json", function(error, data) {
if (error) throw error;

// format the data
data.forEach(function(d) {
  d.Seconds = +d.Seconds;
  d.Amplitude = +d.Amplitude;
});

// define the line
var valueline = d3.line()
.x(function(d) { return x_sound(d.Seconds); })
.y(function(d) { return y_sound(d.Amplitude); });


// Scale the range of the data
x_sound.domain(d3.extent(data, function(d) { return d.Seconds; }));
y_sound.domain(d3.extent(data, function(d) { return d.Amplitude + 0.1; }));
//y.domain([0, d3.max(data, function(d) { return d.close; })]);

// Add the valueline path.
svg_sound.append("path")
  .data([data])
  .attr("class", "line_sound")
  .attr("d", valueline);

// Add the X Axis
svg_sound.append("g")
  .attr("transform", "translate(0," + height + ")")
  .call(d3.axisBottom(x_sound));

svg_sound.append("text")             
  .attr("transform",
        "translate(" + (width/2) + " ," + 
               (height + margin.top + 20) + ")")
.style("text-anchor", "middle")
.text("Seconds");

// Add the Y Axis
svg_sound.append("g")
  .call(d3.axisLeft(y_sound));

svg_sound.append("text")
.attr("transform", "rotate(-90)")
.attr("y", 0 - margin.left)
.attr("x",0 - (height / 2))
.attr("dy", "1em")
.style("text-anchor", "middle")
.text("Amplitude");

});


var inter_sound = setInterval(function() {
  updateDataSound();
  updateAudioAdd();

}, 2000);

function updateAudioAdd(){
      $("#audio_data").attr('src', '/data/brain_wave_raw.mp3'+ '?' + Math.random())[0];

      };


// ** Update data section 
function updateDataSound() {

  // Get the data again
  d3.json("/data/sound_wave_sound_visual.json", function(error, data) {
    if (error) throw error;
    // format the data
    data.forEach(function(d) {
      d.Seconds = +d.Seconds;
      d.Amplitude = +d.Amplitude;
    });

    var valueline = d3.line()
    .x(function(d) { return x_sound(d.Seconds); })
    .y(function(d) { return y_sound(d.Amplitude); });
    
  

    // Scale the range of the data again 
    // Scale the range of the data
    x_sound.domain(d3.extent(data, function(d) { return d.Seconds; }));
    y_sound.domain(d3.extent(data, function(d) { return d.Amplitude + 0.1; }));
  // Select the section we want to apply our changes to
  var svg_sound = d3.select("#sound_value").transition();


  // Make the changes
      svg_sound.select(".line_sound")   // change the line
          .duration(750)
          .attr("d", valueline(data));
      svg_sound.select(".x.axis") // change the x axis
          .duration(750)
          .call(x_sound);
      svg_sound.select(".y.axis") // change the y axis
          .duration(750)
          .call(y_sound);

  });
}

