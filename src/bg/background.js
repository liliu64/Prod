var analyticsURL   = chrome.runtime.getURL("/src/browser_action/analysis.html");
var optionsURL = chrome.runtime.getURL("/src/options/options.html");

var currTab;


var History = {};
var lastActive = "";

var styles = true;
var images = true;
var scripts = true;

//example of using a message handler from the inject scripts
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
  	chrome.pageAction.show(sender.tab.id);
    sendResponse();
  });

function getData() {
	var output = {};
	for (key in History) {
		output[key] = History[key][0];
	}
	return output;
}

// Old second handler, transfered all flow to Activate
// function Update(date, tabId, url) {
  
//   	chrome.storage.sync.get('History', function(data) {
//   		if (data['History'] == null) {
//   			History = {"*://www.google.com/*": [0, "", [0], [""]]};
//   		} else {
//   			History = data['History'];
//   		}
  		
// 	    if (!url) {
// 	    	return;
// 	    }
// 	  	if (date != "") {
// 		  var domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
// 		  domain = '*://'+domain+'/*';
// 		  if (domain in History) {
// 		    History[domain][0] += date.getTime() - new Date(History[domain][1]).getTime();
// 		    History[domain][1] = date.toJSON();
// 		  } else {
// 		    History[domain] = [0,date.toJSON(),0, ""];
// 		  }
// 		} else {
// 			date = new Date();
// 			var domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
// 			domain = '*://'+domain+'/*';
// 		    if (domain in History) {
// 			    History[domain][0] += date.getTime() - new Date(History[domain][1]).getTime();
// 			    History[domain][1] = "";
// 			}
// 		}
// 		chrome.storage.sync.set({'History': History});
// 	} );
	
// }

function Activate(url) {

	chrome.storage.sync.get('History', function(data) {
		if (data['History'] == null) {
  			History = {"*://google.com/*": [0, "", [0], [""], [""]]};
  		} else {
  			History = data['History'];
  		}
  		
	    if (!url) {
	    	return;
	    }
	    var domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
	    if (domain.substring(0,4) == 'www.') domain = domain.substring(4,domain.length);
		domain = '*://'+domain+'/*';
		var date = new Date();
		if (lastActive in History) {
			History[lastActive][0] += date.getTime() - new Date(History[lastActive][1]).getTime();
			History[lastActive][1] = "";
		}

		// bug catcher 
		for (key in History) {
			if (key[1] != "") {
				key[0] = date.getTime() - new Date(key[1]).getTime();
				key[1] = "";
			}
		}


		lastActive = domain;
	    if (domain in History) {
			History[domain][1] = date.toJSON();
	    } else {
	    	History[domain] = [0,date.toJSON(),[0], [""], [""]];
	    }

	    var website = domain.substring(4,domain.length - 2);

	    
	    var maxIndex = -1;
	    var maxHours = 0; 
	    for (var i = 0; i < History[domain][2].length; i++) {
	    	var time = History[domain][2][i];
	    	if (time > 0) {
	    		//60000 ms per minute
	    		if (History[domain][0] > time) {
	    			var hours = time / (60 * 60 * 1000);
	    			if (hours > maxHours) {
	    				maxIndex = i;
	    				maxHours = hours;
	    			}
		    	}
	    	}
	    }
	    if (maxIndex != -1) {
	    	var i = maxIndex;
	    	switch (History[domain][3][i]) {
				case "warning":
					triggerOverlay(History[domain][3][i],website, hours + ' hours', History[domain][4][i]);
					break;
				case "images":
					disableImages(domain, true);
					triggerOverlay(History[domain][3][i],website, hours + ' hours', History[domain][4][i]);
					break;
				case "scripts":
					disableScripts(domain, true);
					triggerOverlay(History[domain][3][i],website, hours + ' hours', History[domain][4][i]);
					break;
				case "styles":
					chrome.tabs.getCurrent(function(tab) {
						disableStyles(tab.id);
					});
					triggerOverlay(History[domain][3][i],website, hours + ' hours', History[domain][4][i]);
					break;
				default:
					break;
			}
	    			
	    }

	    // Non array version of alarms
	    // if (History[domain][2] > 0) {
	    // 	if (History[domain][0] > 60000 * History[domain][2]) {
		   //  	triggerOverlay(History[domain][3],website, History[domain][2].toString() + ' minutes');
		   //  }
	    // }

	    chrome.storage.sync.set({'History': History});
	} );
}

function HandleUpdate(tabId, changeInfo, tab) {
	Activate(changeInfo.url);
	
}

function HandleActivated(activeInfo) {
	var tabId = activeInfo.tabId;
	var url;
	chrome.tabs.get(tabId, function(tab) {
		url = tab.url;
		Activate(url);
	});
}


chrome.tabs.onUpdated.addListener(HandleUpdate);
chrome.tabs.onActivated.addListener(HandleActivated);

function reloadCurrentTab() {  
  chrome.tabs.reload();
}

function setCurrentPagePermission(feature, setting) {  
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    currTab = tabs[0].url + "/";
    var domain = currTab.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
    if (domain.substring(0,4) == 'www.') domain = domain.substring(4,domain.length);
    domain = '*://'+domain+'/*';
    alert(domain);
    feature.set({
      'primaryPattern': domain,
      'setting': setting
    });
    reloadCurrentTab();
  });
}

function setPagePermission(matchPattern, feature, setting, reload) {  
  feature.set({
    'primaryPattern': matchPattern,
    'setting': setting
  });
  if(reload) { reloadCurrentTab(); }
}

function disableImages(matchPattern, reload) {  
  setPagePermission(matchPattern, chrome.contentSettings.images, 'block', reload);
}

function enableImages(matchPattern, reload) {  
  setPagePermission(matchPattern, chrome.contentSettings.images, 'allow', reload);
}

function disableScripts(matchPattern, reload) {  
  setPagePermission(matchPattern, chrome.contentSettings.javascript, 'block', reload);
}

function enableScripts(matchPattern, reload) {  
  setPagePermission(matchPattern, chrome.contentSettings.javascript, 'allow', reload);
}

function disableStyles(tabID){
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, {command: 'modify_styles', setting: 'disable'}, 
    function(response) {
      //alert(response.numStyles);
    });
  });
}

function enableStyles(tabID){
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    chrome.tabs.sendMessage(tabID, {command: 'modify_styles', setting: 'enable'}, 
    function(response) {
      //alert(response.numStyles);
    });
  });
}

function popup(){
  window.open("popup.html");
}

function toggleScripts(){
  if(scripts) disableScripts();
  else       enableScripts();
  scripts = !scripts;
}

function toggleImages(){
  if(images) disableImages();
  else       enableImages();
  images = !images;
}

function toggleStyles(){
  if(styles) disableStyles();
  else       enableStyles();
  styles = !styles;
}

function openOptions(){
  chrome.tabs.create({url: optionsURL});
}

function openAnalytics(){
  chrome.tabs.create({url: analyticsURL});
}
  
function triggerOverlay(type, url, time, unit){
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
      chrome.tabs.sendMessage(tabs[0].id, {command: 'display_message', 
                            setting: type,
                            url: url,
                            time: time,
                            unit: unit}, 
      function(response) {
    });
  });
}

function triggerWarning(){
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        var domain = tabs[0].url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
        triggerOverlay('warning', domain, '9 hours', 'day');
  });
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('toggleJS').onclick = toggleScripts;
    document.getElementById('toggleIMG').onclick = toggleImages;
    document.getElementById('toggleStyles').onclick = toggleStyles;
    document.getElementById('timeData').onclick = popup;
    document.getElementById('openAnalytics').onclick = openAnalytics;
    document.getElementById('openOptions').onclick = openOptions;
    document.getElementById('triggerWarning').onclick = triggerWarning;
});