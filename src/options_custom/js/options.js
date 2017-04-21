// window.localStorage.clear();

$(document).ready(function() {
	// Initialize table
	$('#example').dataTable( {
		// data: getdata(),
		columns: [
		{ data: 'url' },
		{ data: 'alarm' },
		{ data: 'etc' }
		]
	} );
	requestTableUpdate();

 	//Add row
	$('#addrow').click(addRow);

 	// Select rows
	$('#example tbody').on( 'click', 'tr', function () {
		$(this).toggleClass('selected');
	} );

	// $('#button').click( function () {
	// 	alert( table.rows('.selected').data().length +' row(s) selected' );
	// 	} );

	// Remove selected rows
	$('#removerow').click(deleteRow);

} );

function requestTableUpdate() {
	// var dataSet = [];
	
	// for (var key in localStorage) {
	// 	dataSet.push((JSON.parse(localStorage[key])));
	// }
	$('#loadingSpinner').css('visibility', 'visible');
	chrome.storage.sync.get(null, function(data) {
		// console.log(data);
		var dataSet = [];
		for (url in data) {
			dataSet.push(data[url]);
		}
		updateTable(dataSet);
	} );

	// return dataSet
}

// data should be an array of objects
function updateTable(data) {
	$('#example').dataTable().fnClearTable();

	if (data != null && data.length > 0)
		$('#example').dataTable().fnAddData(data);
	$('#loadingSpinner').css('visibility', 'hidden');
}

function addRow() {
	// Form values
	var newurl = $('#form-url').val();
	var newalarm = $('#form-alarm').val();
	var newetc = $('#form-etc').val();

	var newentry = {
		"url": newurl,
		"alarm": newalarm,
		"etc": newetc
	};
	var objRow = {};
	objRow[newurl] = newentry;

	// Insert form values into localStorage
	// window.localStorage.setItem(newurl, JSON.stringify(newentry));
	chrome.storage.sync.set( objRow );

	// Change addmsg in html
	var addmsg = "New URL added. [URL: " + newurl + ", Alarm: " + newalarm + 
		", Etc: " + newetc + "]";
	$('#addmsg').html(addmsg);
	$('#addmsg').css('visibility', 'visible');
	// setTimeout(fade_out, 10000);

	// Update table
	requestTableUpdate();
}


function deleteRow() {
	var todelete = [];
	todelete = $('#example').DataTable().rows('.selected').data();
	var length = todelete.length;

	for (i = 0; i < length; i++) {
		var deleteurl = todelete[i]["url"];
		// localStorage.removeItem(deleteurl);
		chrome.storage.sync.remove(deleteurl);
	}

	requestTableUpdate();
}