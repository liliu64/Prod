/*
 * Handle, load, and refresh elements on the analytics page.
 */

/* Load the entire page when first opened */
window.onload = loadAll();

/* Handle tags for display period from analysis.html */
document.getElementById("ByDay").onclick = showDay;
document.getElementById("ByWeek").onclick = showWeek;
document.getElementById("AllTime").onclick = showAll;

/* Period for which pie chart should display data */
var displayPeriod;

/* Function to handle if user requests data by day */
function showDay() {
	displayPeriod = "d";
	refreshPie();
}

/* Function to handle if user requests data by week */
function showWeek() {
	displayPeriod = "w";
	refreshPie();
}

/* Function to handle if user requests data for all time */
function showAll() {
	displayPeriod = "a";
	refreshPie();
}

/* Initial loading of the analytics page */
function loadAll() {
	/* At first, set the display period to all time */
	displayPeriod = "a"

	refreshPie();

	/* Create a color key for the progress bars */
	var svg = d3.select('.progress')
		.append('svg')
		.attr('height', 30)
		.attr("id", "Color_Key");
	
	// Day color
	svg.append('rect')
		.attr('x', 0)
		.attr('y', 0)
		.attr('fill', '#3ec8f9')
		.attr('height', 10)
		.attr('width', 10)
		.attr('class', 'Color_Key');
	
	// Day text
	svg.append('text')
		.attr('x', 15)
		.attr('y', 5)
		.attr("dy", ".35em")
		.text("= Time Spent Today");

	// Week color
	svg.append('rect')
		.attr('x', 140)
		.attr('y', 0)
		.attr('fill', '#542a20')
		.attr('height', 10)
		.attr('width', 10)
		.attr('class', 'Color_Key');

	// Week text
	svg.append('text')
		.attr('x', 155)
		.attr('y', 5)
		.attr("dy", ".35em")
		.text("= Time Spent This Week");

	/* Draw progress bars for alarms */
	drawBars();
}

/* Refresh the pie chart on the analytics page */
function refreshPie() {
	/* Set current view text */
	if (displayPeriod == "a") {
		document.getElementById("CurrentView").innerHTML = "Current View: All Time";
	}
	else if (displayPeriod == "d") {
		document.getElementById("CurrentView").innerHTML = "Current View: Day";
	}
	else {
		document.getElementById("CurrentView").innerHTML = "Current View: Week";
	}

	/* Remove any charts already drawn */
	d3.select("#No_Data").remove();
	for (i = 0; i < 2; i++) {
		d3.select("#Pie_Chart").remove();
	}

	/* Draw pie chart for correct display period */
	createPie(displayPeriod);
}

/* Refresh the progress bars on the analytics page */
function refreshBars() {
	/* Remove alarm bars there */
	d3.select("#No_Alarms").remove();
	for (i = 0; i < numAlarms; i++) {
		d3.select("#Alarm_Progress").remove();
	}
	numAlarms = 0;
	
	/* Draw new bars */
	drawBars();
}

/* Refresh the entire analytics page */
function refreshAll() {
	refreshPie();
	refreshBars();
}

/* Refresh button refreshes everything on the page */
d3.select(".refresh")
	.on("click", function(){
		refreshAll();
	});