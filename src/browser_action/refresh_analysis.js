d3.select(".refresh")
	.on("click", function(){
		// Refresh pie graph
		loadPie();
		change(loadData());
		
		// Refresh progress bars
		for (i = 0; i < numAlarms; i++) {
			d3.select("#Alarm_Progress").remove();
		}
		numAlarms = 0;
		updateBars();
	});