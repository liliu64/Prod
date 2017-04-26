// window.localStorage.clear();

/* ----------------
 * Functions that directly affect the html page. 
 ------------------ */

// Initialize datatable by requesting data from chrome.storage
$(document).ready(function() {
<<<<<<< HEAD
=======

>>>>>>> master
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
<<<<<<< HEAD
	// Tabs panel
	$("div.bhoechie-tab-menu>div.list-group>a").click(function(e) {
        e.preventDefault();
        $(this).siblings('a.active').removeClass("active");
        $(this).addClass("active");
        var index = $(this).index();
        $("div.bhoechie-tab>div.bhoechie-tab-content").removeClass("active");
        $("div.bhoechie-tab>div.bhoechie-tab-content").eq(index).addClass("active");
    });
=======
>>>>>>> master

} );

/* ----------------
 * Helper functions. 
 ------------------ */

// Update the datatable
function updateTable() {
	// $('#loadingSpinner').css('visibility', 'visible');

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

			// Clean up key
			var cleankey = key.substring(4, key.length - 2)
			entry.push(cleankey, History[key][2], History[key][3]);

			dataSet.push(entry);
		}

		// console.log(dataSet);

		// Update datatable by first erasing it and then re-initializing it
		$('#example').dataTable().fnClearTable();

		if (dataSet != null && dataSet.length > 0) {
			$('#example').dataTable().fnAddData(dataSet);
		}
		// $('#loadingSpinner').css('visibility', 'hidden');

	} );

}

// Add new row, with values given by html form
function addRow() {
	// Form values
	var newurl = $('#form-url').val();
	var newalarm = Number($('#form-alarm').val());
	var newetc = $('#form-etc').val();

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
  			History = {};
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
    		History[domain] = [History[domain][0], History[domain][1], newalarm, newetc];
    	}
    	else if (domain2 in History) {
    		History[domain2] = [History[domain2][0], History[domain2][1], newalarm, newetc];
    	}
    	else { //if new rule
			History[domain] = [0,"", newalarm, newetc];
		}	

  		// Change addmsg in html
  		var addmsg = "New URL added. [URL: " + domain + ", AlarmRule: " + newalarm + 
  		", AlarmType: " + newetc + "]";
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
			
			if (domain in History)
				delete History[domain];
			else 
				console.log("Cannot delete: domain not found in History");
			
		}

		chrome.storage.sync.set({'History': History}, function() {
			updateTable();
		});

	} );

	
}