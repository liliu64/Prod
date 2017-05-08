/*
 * Code from sarahob was used as the template for this progress bar
 * implementation and was adjusted to meet the needs of this project.
 * sarahob's code can be found at
 * gist.github.com/sarahob/1e291c95c4169ddabb77bbd10b6a7ef7
 * as well as on the opensource D3 library examples website.
 */

var bgPage = chrome.extension.getBackgroundPage(); // background.js
var numAlarms = 0; // number of alarms and thus progress bars on the page

// Create and draw one progress bar per URL with flags for alarms
function drawBars() {
	// Get all history information
	// URL: [time, "LastAccess", [alarm0, alarm1], ["type1", "type2"], ["d/w", "d/w"]];
	var allData = bgPage.History;

	for (url in allData) {
		// newAlarms = [url, TimeSpent, [TimesOfAlarms], [AlarmTypes]]
		var newAlarms = [url, allData[url][0]];	// [0] = url, [1] = time spent
		newAlarms[2] = [];	// Array of times of alarms
		newAlarms[3] = [];	// Array of alarm types

		// for all alarms for the URL
		for (alarm in allData[url][2]) {
			if (allData[url][2][alarm] != 0) {
				newAlarms[2].push(allData[url][2][alarm]);
				newAlarms[3].push(allData[url][3][alarm]);
			}
		}

		if (newAlarms[2].length > 0) {
			barWithFlags(newAlarms);
			numAlarms += 1;
		}
	}

}

// Create and draw all progress bars for all alarms
function updateBars() {
	// Get all history information
	// URL: [time, "LastAccess", [alarm0, alarm1], ["type1", "type2"], ["d/w", "d/w"]];
	var allData = bgPage.History; // all the data from History

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

// Create a progress bar given an array of alarms for the same URL
// alarm = [url, TimeSpent, [TimesOfAlarms], [AlarmTypes]]
function barWithFlags(alarm) {
	var svg = d3.select('.progress')
	.append('svg')
	.attr('height', 50)
	.attr("id", "Alarm_Progress");

	// Background rectangle, background of progress bar
	svg.append('rect')
	.attr('rx', 0)
	.attr('ry', 0)
	.attr('x', 300)
	.attr('y', 0)
	.attr('fill', 'grey')
	.attr('height', 10)
	.attr('width', 400)
	.attr("class", "bar");

	// Text for the progress bar
	svg.append('text')
		.attr("y", 5)
		.attr("x", 0)
    	.attr("dy", ".35em")
    	.text(bgPage.unWrapDomain(alarm[0]))
    	.attr("class", "bar-URLs");

    svg.append('text')
    	.attr("y", 5)
    	.attr("x", 265)
    	.attr("dy", ".35em")
    	.text(FormatDuration(alarm[1]))
		.attr("class", "bar-TimeSpent");

	// Progress rectangle, colored part of progress bar
	var progress = svg.append('rect')
					.attr('rx', 0)
					.attr('ry', 0)
					.attr('x', 300)
					.attr('y', 0)
					.attr('fill', 'brown')
					.attr('height', 10)
					.attr('width', 0)
					.attr('class', 'bar');

	// Fill the progress bar color up to amount of time spent
	var longestTime = 0.0;
	progress.transition()
		.duration(1000)
		.attr('width', function(){
			for (time in alarm[2]) {
				if (alarm[2][time] > longestTime) {
					longestTime = alarm[2][time];
				}
			}
			if (alarm[1]/longestTime > 1) {
				return 400;
			}
			else {
				return 4.0 * (alarm[1]/longestTime) * 100;
			}
		});

	// Create text flags for each of the alarms
	for (flag in alarm[2]) {
		svg.append('text')
			.attr("y", 20)
			.attr("x", function() {
				var dist = 300;
				dist = dist + (4.0 * (alarm[2][flag]/longestTime) * 100);
				return dist;
			})
			.text(function() {
				var flagText = "| " + alarm[3][flag];		// add alarm type
				flagText = flagText + ": " + FormatDuration(alarm[2][flag]); // add alarm time
				return flagText;
			})
			.attr("class", "bar-flags");
	}
}

// Create a progress bar given an alarm
// alarm = [url, TimeSpent, TimeOfAlarm, AlarmType]
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
    	.attr("class", "barlabels")
    	.text(function(){
    		var urlName = bgPage.unWrapDomain(alarm[0]);
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