bgpg = chrome.extension.getBackgroundPage();

// window.localStorage.clear();

/* ----------------
 * Functions that directly affect the html page. 
 ------------------ */

// Initialize datatable by requesting data from chrome.storage
$(document).ready(function() {
	// Initialize table
	$('#example').dataTable( {
		// data: getdata(),
		// columns: [
		// { data: 'url' },
		// { data: 'alarm' },
		// { data: 'etc' }
		// ]
	} );
	updateTable();

 	//Add row
	$('#addrow').click(addRow);
	// $('#addrow').on('click', addRow);
 	// Select rows
	$('#example tbody').on( 'click', 'tr', function () {
		$(this).toggleClass('selected');
	} );
	// Remove selected rows
	$('#removerow').click(deleteRow);
	// Tabs panel
	$("div.bhoechie-tab-menu>div.list-group>a").click(function(e) {
        e.preventDefault();
        $(this).siblings('a.active').removeClass("active");
        $(this).addClass("active");
        var index = $(this).index();
        $("div.bhoechie-tab>div.bhoechie-tab-content").removeClass("active");
        $("div.bhoechie-tab>div.bhoechie-tab-content").eq(index).addClass("active");
    });

} );

/* ----------------
 * Helper functions. 
 ------------------ */

// Update the datatable
function updateTable() {
	$('#loadingSpinner').css('visibility', 'visible');

	chrome.storage.sync.get('History', function(data) {
		var History;

		if (data['History'] == null) {

  			History = {"*://*.google.com/*": {total: {all: 0, day: 0, week: 0}, 
  				startDate: "", alarms: [] } };
  			console.log("Empty History: created new history");
  		} else {
  			History = data['History'];
  		}

		var dataSet = [];

		// Convert History into array format (with 3 values)
		for (key in History) {

			// skip if no alarms
			if (History[key].alarms.length == 0) continue;

			var entry = []; //[URL, Dur, Per, Action, Enabled]

			var alarmsArr = History[key].alarms;
			var durArr = [];
			var perArr = [];
			var typeArr = [];
			var enabledArr = [];

			for (alarm in alarmsArr) {
				var anAlarm = alarmsArr[alarm];
				durArr.push(anAlarm.duration);
				perArr.push(anAlarm.per);
				typeArr.push(anAlarm.type);
				enabledArr.push(anAlarm.enabled);
			}

			entry.push(key, durArr, perArr, typeArr, enabledArr);

			dataSet.push(entry);
		}


		// Update datatable by first erasing it and then re-initializing it
		$('#example').dataTable().fnClearTable();

		if (dataSet != null && dataSet.length > 0) {
			$('#example').dataTable().fnAddData(dataSet);
		}
		$('#loadingSpinner').css('visibility', 'hidden');

	} );

}

// Add new row, with values given by html form
function addRow() {
	// Form values
	var newurl = $('#form-url').val();
	var newalarm = Number($('#form-alarm').val()); //assume ms
	var newper = $('#form-per').val(); 
	var newaction = $('#form-action').val();
	var newenabled = $('#form-enabled').val();
	
	//Check url from form
	if (!newurl) {
		console.log("No URL found!"); //**** put red warning msg
		return;
	}
	if (newalarm <= 0) {
		console.log("invalid alarm rule");
		return;
	}

	chrome.storage.sync.get('History', function(data) {
		var History;

		if (data['History'] == null) {
  			History = {"*://*.google.com/*": {total: {all: 0, day: 0, week: 0}, 
  				startDate: "", alarms: [] } };
  			console.log("Empty History: created new history");
  		} else {
  			History = data['History'];
  		}
  		
  		// Parse newurl
  		if (newurl.startsWith("www.")) {
  			newurl = newurl.substring(4);
    	}
  		newurl = "https://" + newurl + "/";
  		var domain = newurl.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
    	domain = bgpg.wrapDomain(domain);

    	// parse newenabled
    	var boolEnabled;
    	if (newenabled == "true") boolEnabled = true;
    	else if (newenabled == "false") boolEnabled = false;

    	// Prepare blob
    	var blob = {duration: newalarm, type: newaction, per: newper, enabled: boolEnabled};
    	
 		// Add new blob to domain in History
 		if (domain in History) {
 			// console.log(typeof(History[domain].alarms));
 			History[domain].alarms.push(blob);
 		}
 		else {
 			History[domain] = {total: {all: 0, day: 0, week: 0}, startDate: "",
         	alarms: [blob] };
      }

  		// Change addmsg in html
  		var addmsg = "New URL added. [URL: " + domain + ", Duration (ms): " + newalarm +
  		" per " + newper +  ", Action: " + newaction + ". This is " + newenabled + " ]";
		$('#addmsg').html(addmsg);
		$('#addmsg').css('visibility', 'visible');

		chrome.storage.sync.set({'History': History}, function() {
			updateTable();
		});

	} );
}

function deleteRow() {
	var todelete = [];
	todelete = $('#example').DataTable().rows('.selected').data();
	var length = todelete.length;

	chrome.storage.sync.get('History', function(data) {
		if (data['History'] == null)
			console.log("Cannot delete: History is null");
		
		var History =  data['History'];

		for (i = 0; i < length; i++) {
			// Get url
			var domain = todelete[i][0];
			// domain = bgpg.wrapDomain(domain);
			
			if (domain in History) {
				// re-enable images and scripts for selected urls to delete
				bgpg.enableImages(domain, false);
				bgpg.enableScripts(domain, false);
				bgpg.enableStyles(domain, false);
				// delete History[domain];
				History[domain].alarms = [];
			}
			else 
				console.log("Cannot delete: domain not found in History");
			
		}

		chrome.storage.sync.set({'History': History}, function() {
			updateTable();
		});

	} );

	
}