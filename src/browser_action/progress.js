/*
 * Code from sarahob was used as the template for this progress bar
 * implementation and was adjusted to meet the needs of this project.
 * sarahob's code can be found at
 * gist.github.com/sarahob/1e291c95c4169ddabb77bbd10b6a7ef7
 * as well as on the opensource D3 library examples website.
 */

var bgPage = chrome.extension.getBackgroundPage(); // background.js
var numAlarms = 0; // number of alarms and thus progress bars on the page

// Create and draw all progress bars
function updateBars() {
	// Get all history information
	// URL: [time, "LastAccess", [alarm0, alarm1], ["type1", "type2"], ["d/w", "d/w"]];
	var allData = bgPage.History; // all the data from History
	var allAlarms = {}; // all the alarms that exist

	// Create progress bars for each valid alarm for each url
	for (url in allData) {
		for (alarm in allData[url][2]) {
			if (allData[url][2][alarm] != 0) {
				// will pass this array to create()
				// consists of [url, TimeSpent, TimeOfAlarm, AlarmType]
				var newAlarm = [url, allData[url][0], allData[url][2][alarm], allData[url][3][alarm]];
				createBar(newAlarm);
				numAlarms += 1;
			}
		}
	}
}

// Call function once
updateBars();

// Create a progress bar given an alarm
function createBar(alarm) {
	var svg = d3.select('.progress')
		.append('svg')
		.attr('height', 50)
		.attr("id", "Alarm_Progress");

	// Background rectangle, background of entire progress bar
	svg.append('rect')
		.attr('class', 'bg-rect')
		.attr('rx', 10)
		.attr('ry', 10)
		.attr('x', 400)
		.attr('y', 0)
		.attr('fill', 'grey')
		.attr('height', 10)
		.attr('width', 400);

	// Text for the progress bar
	svg.append('text')
		.attr("y", 5)
		.attr("x", 0)
    	.attr("dy", ".35em")
    	.text(function(){
    		var urlName = alarm[0].substring(4, alarm[0].length - 2);
    		urlName = urlName + " - " + alarm[3] + " (" + FormatDuration(alarm[2]) + ")";
    		if (alarm[1]/alarm[2] > 1) {
    			urlName = urlName + ": TIME'S UP! (";
    		}
    		else {
    			urlName = urlName + ": (";
    		}
    		urlName = urlName + FormatDuration(alarm[1]) + ", ";
    		urlName = urlName + (Math.floor(alarm[1]/alarm[2] * 1000)/10) + "%)";
    		return urlName;
    	});

    // Progress rectangle, colored part of progress bar
	var progress = svg.append('rect')
					.attr('class', 'progress-rect')
					.attr('rx', 10)
					.attr('ry', 10)
					.attr('x', 400)
					.attr('y', 0)
					.attr('fill', 'brown')
					.attr('height', 10)
					.attr('width', 0);

	// Fill the progress bar color up to amount of time spent
	progress.transition()
		.duration(1000)
		.attr('width', function(){
			if (alarm[1]/alarm[2] > 1) {
				return 400;
			}
			else {
				return 4.0 * (alarm[1]/alarm[2]) * 100;
			}
		});
}