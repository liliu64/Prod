/*
 * Handle, load, and refresh elements on the analytics page.
 */

/* Period for which pie chart should display data */
var displayPeriod;

/* Handle tags for display period from analysis.html */
document.getElementById("ByDay").onclick = showDay;
document.getElementById("ByWeek").onclick = showWeek;
document.getElementById("AllTime").onclick = showAll;

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
	displayPeriod = "a"
	createPie(displayPeriod);
	drawBars();
}

/* Refresh the pie chart on the analytics page */
function refreshPie() {
	d3.select("#No_Data").remove();
	for (i = 0; i < 2; i++) {
		d3.select("#Pie_Chart").remove();
	}
	createPie(displayPeriod);
}

/* Refresh the progress bars on the analytics page */
function refreshBars() {
	d3.select("#No_Alarms").remove();
	for (i = 0; i < numAlarms; i++) {
		d3.select("#Alarm_Progress").remove();
	}
	numAlarms = 0;
	drawBars();
}

/* Refresh the entire analytics page */
function refreshAll() {
	refreshPie();
	refreshBars();
}

window.onload = loadAll();

/*
window.onfocus = function() {
	focus = true;
	refreshAll();
}
window.blur = function() {
	focus = false;
}
*/

d3.select(".refresh")
	.on("click", function(){
		refreshAll();
	});