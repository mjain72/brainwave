function changeStatus(){
    // Get the data
    d3.json("/data/noise_status.json", function(error, data) {
        if (error) throw error;
        
        // format the data
    data.forEach(function(d) {
        d.Status_Number = +d.Status_Number;
    });
    var status_text = d3.select('#sensor_status');
    if((data[0]['Status'] <= 5 || data[0]['Status'] == 255)  && (data[2]['Status'] <= 5 || data[2]['Status'] == 255)
            && (data[4]['Status'] <= 5 || data[4]['Status'] == 255)){

        status_text.text("Good Connection ");
        status_text.style('color', 'green');
    }
    else {
        status_text.text("Bad connection or electorde not touching the skin");
        status_text.style('color', 'red');
        
    }
     console.log(data[0]['Status']);
    
    
    

    console.table(data)

  });
}

var inter_noise = setInterval(function(){
    changeStatus();
}, 5000);
