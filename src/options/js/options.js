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
		var History = {};

  		History = data['History'];

		var dataSet = [];

		// Convert History into array format (with 3 values)
		for (key in History) {
			var entry = [];

			// Only get urls with valid alarm rules
			if (History[key][2] <= 0) {
				continue;
			}

			// Reconvert alarm duration from ms to min
			var durationMSarr = History[key][2].map(function(x) {
				return x / 60000;
			});
			

			// Process URL for table: [url, duration array, per, type]
			var cleankey = key.substring(4, key.length - 2)
			entry.push(cleankey, durationMSarr,  History[key][4], History[key][3]);

			dataSet.push(entry);
		}

		// console.log(dataSet);

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
	var newalarm = Number($('#form-alarm').val()); //assume minutes
	var newetc = $('#form-etc').val();
	var newetc2 = $('#form-etc2').val();

	// Convert alarm duration from mins to ms
	newalarm = newalarm * 60000;

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
  			History = {"*://www.google.com/*": [0, "", [0], [""], [""]]};
  			console.log("Empty History: created new history");
  		} else {
  			History = data['History'];
  		}
  		
  		// Parse url
  		if (newurl.startsWith("www.")) {
  			newurl = newurl.substring(4);
    	}
  		newurl = "https://" + newurl + "/";
  		var domain = newurl.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];

    	// Prepare domain to match with History index
    	var domain2 = '*://www.'+domain+'/*'
    	domain = '*://'+domain+'/*';
    	
   	// Add to History
    	if (domain in History) { //if this exists in History
    		var alarmdur = History[domain][2];
    		var alarmtype = History[domain][3];
    		var alarmper = History[domain][4];
    		alarmdur.push(newalarm);
    		alarmtype.push(newetc);
    		alarmper.push(newetc2);
    		History[domain] = [History[domain][0], History[domain][1], alarmdur, alarmtype, alarmper];
    	}
    	else if (domain2 in History) {
    		var alarmdur = History[domain2][2];
    		var alarmtype = History[domain2][3];
    		var alarmper = History[domain2][4];
    		alarmdur.push(newalarm);
    		alarmtype.push(newetc);
    		alarmper.push(newetc2);
    		History[domain2] = [History[domain2][0], History[domain2][1], alarmdur, alarmtype, alarmper];
    	}
    	else { //if new rule
    		var alarmdur = [0];
    		var alarmtype = [""];
    		var alarmper = [""];
    		alarmdur.push(newalarm);
    		alarmtype.push(newetc);
    		alarmper.push(newetc2);
			History[domain] = [0,"", alarmdur, alarmtype, alarmper];
		}	

  		// Change addmsg in html
  		var addmsg = "New URL added. [URL: " + domain + ", Duration (ms): " + newalarm + 
  		", AlarmType: " + newetc + " , " + newetc2 +  "]";
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
			domain = '*://'+domain+'/*';
			
			if (domain in History) {
				// re-enable images and scripts for selected urls to delete
				bgpg.enableImages(domain, false);
				bgpg.enableScripts(domain, false);
				delete History[domain];
			}
			else 
				console.log("Cannot delete: domain not found in History");
			
		}

		chrome.storage.sync.set({'History': History}, function() {
			updateTable();
		});

	} );

	
}