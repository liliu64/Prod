d3.select(".refresh")
	.on("click", function(){
		// Refresh pie graph
		for (i = 0; i < 2; i++) {
			d3.select("#Pie_Chart").remove();
		}
		createPie();
		
		// Refresh progress bars
		for (i = 0; i < numAlarms; i++) {
			d3.select("#Alarm_Progress").remove();
		}
		numAlarms = 0;
		updateBars();
	});