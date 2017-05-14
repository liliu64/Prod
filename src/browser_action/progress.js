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
	var allData = bgPage.History;

	for (url in allData) {
		// newAlarms holds all alarms for a given URL
		var newAlarms = {
			URL: url,
			TIMES: allData[url].total,
			ALARM_TIMES: [],
			ALARM_TYPES: [],
			ALARM_PERIODS: []
		};

		// for all alarms for the URL
		for (alarm in allData[url].alarms) {
			if ((allData[url].alarms[alarm].duration > 0) && (allData[url].alarms[alarm].enabled)) {
				newAlarms.ALARM_TIMES.push(allData[url].alarms[alarm].duration);
				newAlarms.ALARM_TYPES.push(allData[url].alarms[alarm].type);
				newAlarms.ALARM_PERIODS.push(allData[url].alarms[alarm].per);
			}
		}

		// if there are alarms, create bars
		if (newAlarms.ALARM_TIMES.length > 0) {
			barWithFlags(newAlarms);
			numAlarms += 1;
		}

		if (numAlarms == 0) {
			var svg = d3.select('.progress')
			.append('text')
    		.attr("dy", ".35em")
    		.text("No Alarms Set")
    		.attr("id", "No_Alarms");
    		return;
		}
	}

}

// Create a progress bar given an object containing alarms for the same URL
function barWithFlags(alarm) {
	var svg = d3.select('.progress')
	.append('svg')
	.attr('height', 50)
	.attr("id", "Alarm_Progress");

	// Background rectangle, background of progress bar
	svg.append('rect')
	.attr('rx', 0)
	.attr('ry', 0)
	.attr('x', 250)
	.attr('y', 0)
	.attr('fill', 'grey')
	.attr('height', 10)
	.attr('width', 500)
	.attr("class", "bar");

	// Text for the progress bar
	svg.append('text')
		.attr("y", 5)
		.attr("x", 0)
    	.attr("dy", ".35em")
    	.text(bgPage.unWrapDomain(alarm.URL))
    	.attr("class", "bar-URLs");

    // Progress rectangle for week
	var progressWeek = svg.append('rect')
					.attr('rx', 0)
					.attr('ry', 0)
					.attr('x', 250)
					.attr('y', 0)
					.attr('fill', '#542a20')
					.attr('height', 10)
					.attr('width', 0)
					.attr('class', 'bar');

	// Progress rectangle for day
	var progressDay = svg.append('rect')
					.attr('rx', 0)
					.attr('ry', 0)
					.attr('x', 250)
					.attr('y', 0)
					.attr('fill', '#3ec8f9')
					.attr('height', 10)
					.attr('width', 0)
					.attr('class', 'bar');


	// Fill the progress bar color up to amount of time spent
	// Find the longest time of an alarm
	var longestTime = 0.0;
	for (timeEntry in alarm.ALARM_TIMES) {
		if (alarm.ALARM_TIMES[timeEntry] > longestTime) {
			longestTime = alarm.ALARM_TIMES[timeEntry];
		}
	}

	// Draw week progress
	progressWeek.transition()
		.duration(1000)
		.attr('width', function(){
			if (alarm.TIMES.w/longestTime > 1) {
				return 500;
			}
			else {
				if (alarm.TIMES.w == undefined) {
					return 0;
				}
				else return 5.0 * (alarm.TIMES.w/longestTime) * 100;
			}
		});

	// Draw day progress
	progressDay.transition()
		.duration(1000)
		.attr('width', function(){
			if (alarm.TIMES.d/longestTime > 1) {
				return 500;
			}
			else {
				if (alarm.TIMES.w == undefined) {
					return 0;
				}
				else return 5.0 * (alarm.TIMES.d/longestTime) * 100;
			}
		});


	// Create text flags for each of the alarms
	for (flag in alarm.ALARM_TIMES) {
		// Text for alarm type
		svg.append('text')
			.attr("y", 20)
			.attr("x", function() {
				var dist = 250;
				dist = dist + (5.0 * (alarm.ALARM_TIMES[flag]/longestTime) * 100);
				return dist;
			})
			.text(function() {
				var flagText = "| " + alarm.ALARM_TYPES[flag];		// add alarm type
				return flagText;
			})
			.attr("class", "bar-flags");
		// Text for alarm time
		svg.append('text')
			.attr("y", 35)
			.attr("x", function() {
				var dist = 250;
				dist = dist + 6 + (5.0 * (alarm.ALARM_TIMES[flag]/longestTime) * 100);
				return dist;
			})
			.text(function() {
				var flagText = FormatDuration(alarm.ALARM_TIMES[flag]); // add alarm time
				flagText = flagText + "/";
				if (alarm.ALARM_PERIODS[flag] == "w") {
					flagText += "wk";
				}
				else {
					flagText += "day";
				}
				return flagText;
			});
	}
}

/*
// Create and draw all progress bars for all alarms
function updateBars() {
	// Get all history information
	// URL: [time, "LastAccess", [alarm0, alarm1], ["type1", "type2"], ["d/w", "d/w"]];
	var allData = bgPage.History; // all the data from History

	// Create progress bars for each valid alarm for each url
	for (url in allData) {
		for (alarm in allData[url][2]) {
			if (allData[url][2][alarm] > 0) {
				// will pass this array to create()
				// consists of [url, TimeSpent, TimeOfAlarm, AlarmType]
				var newAlarm = [url, allData[url][0], allData[url][2][alarm], allData[url][3][alarm]];
				createBar(newAlarm);
				numAlarms += 1;
			}
		}
	}
}
*/

/*
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
*/