// window.localStorage.clear();

/* ----------------
 * Functions that directly affect the html page. 
 ------------------ */

// Initialize datatable by requesting data from chrome.storage
$(document).ready(function() {
	// Table formatting
 	// $( "#tabs" ).tabs();
 	// $( "#tabs" ).addClass('ui-tabs-vertical ui-helper-clearfix');
	// $( "#tabs" ).tabs().addClass( "ui-tabs-vertical ui-helper-clearfix" );
	// $( "#tabs li" ).removeClass( "ui-corner-top" ).addClass( "ui-corner-left" );

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
 	// Select rows
	$('#example tbody').on( 'click', 'tr', function () {
		$(this).toggleClass('selected');
	} );
	// Remove selected rows
	$('#removerow').click(deleteRow);

	// var tabsFn = (function() {

	// 	function init() {
	// 		setHeight();
	// 	}

	// 	function setHeight() {
	// 		var $tabPane = $('.tab-pane'),
	// 		tabsHeight = $('.nav-tabs').height();

	// 		$tabPane.css({
	// 			height: tabsHeight
	// 		});
	// 	}

	// 	$(init);
	// })();

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

	chrome.storage.sync.get('History', function(data) {
		var History;

		if (data['History'] == null) {
  			History = {};
  			console.log("Setting default site");
  		} else {
  			History = data['History'];
  		}
  		
  		// Parse url
  		newurl = "https://" + newurl + "/";
  		var domain = newurl.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
    	domain = '*://'+domain+'/*';

		History[domain] = [0,0, newalarm, newetc];

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
		var History =  data['History'];

		for (i = 0; i < length; i++) {
			// Get url
			var domain = todelete[i][0];
			domain = '*://'+domain+'/*';
			
			delete History[domain];
			
		}
		// console.log(History);

		chrome.storage.sync.set({'History': History}, function() {
			updateTable();
		});

	} );

	
}