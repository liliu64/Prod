/* 
 * Code from David Buezas was used as the template for this graph 
 * and was adjusted to meet the specific needs of this project.
 * David Buezas' code is found at gist.github.com/dbuezas/9306799
 * as well as on the D3 library examples website.
 */


var svg = d3.select("body")
	.append("svg")
	.append("g")

svg.append("g")
	.attr("class", "slices");
svg.append("g")
	.attr("class", "labels");
svg.append("g")
	.attr("class", "lines");

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

var color = d3.scale.category20()
	.domain(["filler"]);

var usedSites = {};

var key;

function loadPie() {
	var bgPage = chrome.extension.getBackgroundPage();	// background.js
	var siteData = bgPage.getData();	// key = url, value = time
	usedSites = {}; // sites used to tally time
	var sites = [];	// site names to use

	// Array of sites to be excluded from analysis, including but not limited to
	// extension pages and new tab page
	var excluded = ["*://newtab/*", chrome.runtime.id, "*://extensions/*"];

	// If site information is not long enough (5% of total time), do not include
	var totalTime = 0.0;
	// Calculate total time spent in browsing session for sites included
	for (url in siteData) {
		// Exclude all unwanted sites
		var exclude = false;
		for (site in excluded) {
			if (url.includes(excluded[site])) {
				exclude = true;
			}
		}
		// Note all wanted urls and calculate total time
		if (!exclude) {
			var labelName = url;
			labelName = labelName.substring(4, labelName.length - 2);
			labelName += ": " + FormatDuration(siteData[url]);
			usedSites[labelName] = siteData[url];
			totalTime = totalTime + siteData[url];
		}
	}

	for (url in usedSites) {
		if (totalTime < 500000) {
			var degree = 0.001;
		}
		else {
			var degree = 0.02;	// Threshold for which data is excluded
		}
		if (usedSites[url] > (degree * totalTime)) {
			sites.push(url);
		}
	}

	svg.attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

	key = function(d){ return d.data.label; };

	if ((sites.length % 10 > 0) && (sites.length % 10 < 4)) {
		color = d3.scale.category20()
			.domain(sites);
	}
	else {
		color = d3.scale.category10()
			.domain(sites);
	}
	change(loadData());
}

loadPie();

function loadData (){
	var labels = color.domain();
	return labels.map(function(label){
		return { label: label, value: usedSites[label]}
	});
}


function change(data) {

	/* ------- PIE SLICES -------*/
	var slice = svg.select(".slices").selectAll("path.slice")
		.data(pie(data), key);

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
				return arc(interpolate(t));
			};
		})

	slice.exit()
		.remove();

	/* ------- TEXT LABELS -------*/

	var text = svg.select(".labels").selectAll("text")
		.data(pie(data), key);

	text.enter()
		.append("text")
		.attr("dy", ".35em")
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
				var pos = outerArc.centroid(d2);
				pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
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
		.data(pie(data), key);
	
	polyline.enter()
		.append("polyline");

	polyline.transition().duration(1000)
		.attrTween("points", function(d){
			this._current = this._current || d;
			var interpolate = d3.interpolate(this._current, d);
			this._current = interpolate(0);
			return function(t) {
				var d2 = interpolate(t);
				var pos = outerArc.centroid(d2);
				pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
				return [arc.centroid(d2), outerArc.centroid(d2), pos];
			};			
		});
	
	polyline.exit()
		.remove();
};