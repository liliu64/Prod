// window.localStorage.clear();
// chrome.storage.local.set({items:items});

//Set 
// window.localStorage.setItem(url1, JSON.stringify(val1));

$(document).ready(function() {
	// Initialize table
	$('#example').DataTable( {
		data: getdata(),
		columns: [
		{ data: 'url' },
		{ data: 'alarm' },
		{ data: 'etc' }
		]
	} );

 	//Add row
	$('#addrow').click(addRow);

 	// Select rows
	$('#example tbody').on( 'click', 'tr', function () {
		$(this).toggleClass('selected');
	} );

	// $('#button').click( function () {
 //        alert( table.rows('.selected').data().length +' row(s) selected' );
 //    } );

	// Remove selected rows
	$('#removerow').click(deleteRow);

} );

// Returns data in format [ {url, alarm, etc], ... ]
function getdata() {
	var dataSet = [];
	for (var key in localStorage)
		dataSet.push((JSON.parse(localStorage[key])));
	return dataSet;
}

function redrawTable() {
	$('#example').dataTable().fnClearTable();
	var data = getdata();
	if (data != null && data.length != null && data.length > 0)
		$('#example').dataTable().fnAddData(data);
	else 
		console.log("redrawTable error");
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
	// Insert form values into localStorage
	window.localStorage.setItem(newurl, JSON.stringify(newentry));

	// $('#example').dataTable().fnAddData( newentry );

	// Update table
	redrawTable();
}

function deleteRow() {
	// $('#example').DataTable().row('.selected').remove().draw( false );
	var todelete = [];
	todelete = $('#example').DataTable().rows('.selected').data();
	var length = todelete.length;

	for (i = 0; i < length; i++) {
		var deleteurl = todelete[i]["url"];
		localStorage.removeItem(deleteurl);
	}

	redrawTable();
}