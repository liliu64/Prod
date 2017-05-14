/* 
 * Code from David Buezas was used as the template for this graph 
 * and was adjusted to meet the specific needs of this project.
 * David Buezas code originally a template for a pie chart with
 * labels and smooth updating.
 * David Buezas' code is found at gist.github.com/dbuezas/9306799
 * as well as on the D3 library examples website.
 */

var svg;

/* Creates and draws the pie chart on the page */
function createPie(period) {
	/* Create the pie chart object */
	svg = d3.select(".piechart")
	.append("svg")
	.attr("id", "Pie_Chart")
	.append("g")
	.attr("id", "Pie_Chart");

	svg.append("g")
		.attr("class", "slices");
	svg.append("g")
		.attr("class", "labels");
	svg.append("g")
		.attr("class", "lines");

	/* Pie chart settings */
	var width = 960,
	    height = 450,
		radius = Math.min(width, height) / 2;

	var pie = d3.layout.pie()
		.sort(null)
		.value(function(d) {
			return d.value;
		});

	var arc = d3.svg.arc()
		.outerRadius(radius * 0.8)
		.innerRadius(radius * 0.4);

	var outerArc = d3.svg.arc()
		.innerRadius(radius * 0.9)
		.outerRadius(radius * 0.9);

	var pieSettings = [width, height, radius, pie, arc, outerArc];

	loadPie(svg, pieSettings, period);
}

/* Retrieve data and draw a pie */
function loadPie(svg, pieSettings, period) {
	var bgPage = chrome.extension.getBackgroundPage();	// background.js
	var siteData = bgPage.getTotals();	// key = url, value = time
	var usedSites = {}; // sites used to tally time
	var sites = [];	// site names to use

	// Array of sites to be excluded from analysis, including but not limited to
	// extension pages and new tab page
	var excluded = ["newtab", chrome.runtime.id, "extensions"];

	// If site information is not long enough, do not include
	var totalTime = 0.0;	// total time spent on sites

	// Calculate total time spent in browsing session for sites included
	for (url in siteData) {
		// Exclude all unwanted sites
		var exclude = false;
		for (site in excluded) {
			if (bgPage.unWrapDomain(url).includes(excluded[site])) {
				exclude = true;
			}
		}
		// Note all wanted urls and calculate total time
		if (!exclude) {
			var labelName = bgPage.unWrapDomain(url);
			if (siteData[url][period] > 0) {
				labelName += ": " + FormatDuration(siteData[url][period]);
				usedSites[labelName] = siteData[url][period];
				totalTime = totalTime + siteData[url][period];
			}
		}
	}

	for (url in usedSites) {
		var degree = 0.02;	// Threshold for which data is excluded
		if (usedSites[url] >= (degree * totalTime)) {
			sites.push(url);
		}
	}

	svg.attr("transform", "translate(" + pieSettings[0] / 2 + "," + pieSettings[1] / 2 + ")");

	var key = function(d){ return d.data.label; };

	if ((sites.length % 10 > 0) && (sites.length % 10 < 4)) {
		var color = d3.scale.category20()
			.domain(sites);
	}
	else {
		var color = d3.scale.category10()
			.domain(sites);
	}
	change(loadData(color, usedSites), color, svg, key, pieSettings);
}

/* Load all of the data and labels of the pie chart */
function loadData (color, usedSites){
	var labels = color.domain();
	return labels.map(function(label){
		return { label: label, value: usedSites[label]}
	});
}

/* Update the graph */
function change(data, color, svg, key, pieSettings) {
	/* ------- PIE SLICES -------*/
	var slice = svg.select(".slices").selectAll("path.slice")
		.data(pieSettings[3](data), key);

	slice.enter()
		.insert("path")
		.style("fill", function(d) { return color(d.data.label); })
		.attr("class", "slice");

	slice		
		.transition().duration(1000)
		.attrTween("d", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				return pieSettings[4](interpolate(t));
			};
		})

	slice.exit()
		.remove();

	/* ------- TEXT LABELS -------*/

	var text = svg.select(".labels").selectAll("text")
		.data(pieSettings[3](data), key);

	text.enter()
		.append("text")
		.attr("dy", ".35em")
		.attr("class", "pielabels")
		.text(function(d) {
			return d.data.label;
		});
	
	function midAngle(d){
		return d.startAngle + (d.endAngle - d.startAngle)/2;
	}

	text.transition().duration(1000)
		.attrTween("transform", function(d) {
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				var pos = pieSettings[5].centroid(d2);
				pos[0] = pieSettings[2] * (midAngle(d2) < Math.PI ? 1 : -1);
				return "translate("+ pos +")";
			};
		})
		.styleTween("text-anchor", function(d){
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				return midAngle(d2) < Math.PI ? "start":"end";
			};
		});

	text.exit()
		.remove();

	/* ------- SLICE TO TEXT POLYLINES -------*/

	var polyline = svg.select(".lines").selectAll("polyline")
		.data(pieSettings[3](data), key);
	
	polyline.enter()
		.append("polyline");

	polyline.transition().duration(1000)
		.attrTween("points", function(d){
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				var pos = pieSettings[5].centroid(d2);
				pos[0] = pieSettings[2] * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
				return [pieSettings[4].centroid(d2), pieSettings[5].centroid(d2), pos];
			};			
		});
	
	polyline.exit()
		.remove();
};