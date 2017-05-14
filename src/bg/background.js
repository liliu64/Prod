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

function getTotals() {
	var output = {};
	for (key in History) {
		output[key] = History[key].total;
	}
	return output;
}

function wrapDomain (domain) {
  return '*://*.'+domain+'/*';
}

function unWrapDomain (domain) {
  return domain.replace('*://*.', '').replace('/*', '');
}

function incrementTotals (urlObj, amount) {
  urlObj.total.all += amount;
  urlObj.total.day += amount;
  urlObj.total.week += amount;
}

function Activate(url, tabId) {
  chrome.storage.sync.get('History', function(data) {
    //Ensure history exists. If it doesn't add starter history with just "*://*.google.com/*"
    if (data['History'] == null) {
        History = {"*://*.google.com/*": {
                      total: {all: 0, day: 0, week: 0},
                      startDate: "",
                      alarms: []
                    };
      } else {
        History = data['History'];
      }
      
      if (!url) {
        return;
      }
      var domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
      if (domain.substring(0,4) == 'www.') domain = domain.substring(4,domain.length);
    domain = wrapDomain(domain);
    var date = new Date();

    // bug catcher 
    for (key in History) {
      if (History[key].startDate != "") {
        incrementTotals(History[key], date.getTime() - new Date(History[key].startDate).getTime());
        History[key].startDate = "";
      }
    }


    lastActive = domain;
      if (domain in History) {
      	History[domain].startDate = date.toJSON();
      } else {
        History[domain] = { total: {all: 0, day: 0, week: 0},
                            startDate: date.toJSON(),
                            alarms: []
                          };
      }

      var website = unWrapDomain (domain);

      
      var maxIndex = -1;
      var maxHours = 0; 
      for (var i = 0; i < History[domain].alarms.length; i++) {
        currAlarm = History[domain].alarms[i];
        var time = currAlarm.duration;
        if (time > 0 && currAlarm.enabled) {
          //60000 ms per minute
          if (History[domain].total.(currAlarm.per) > time) {
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
        currAlarm = History[domain].alarms[i];
        var time = currAlarm.duration;

        var period = "";
       	if (currAlarm.per == 'w') {
       		period = 'week'
       	} else period = 'day';

        switch (currAlarm.type) {
        case "warning":
          triggerOverlay(currAlarm.type,website, FormatDuration(time), period);
          break;
        case "images":
          chrome.contentSettings.images.get({primaryUrl: url}, function (details) {
            if(details.setting == 'allow') disableImages(domain, true);
            else triggerOverlay(currAlarm.type,website, FormatDuration(time), period);
          });
          break;
        case "scripts":
          chrome.contentSettings.javascript.get({primaryUrl: url}, function (details) {
            if(details.setting == 'allow') disableScripts(domain, true);
            else triggerOverlay(currAlarm.type,website, FormatDuration(time), period);
          });
          break;
        case "styles":
          disableStyles(tabId, 
          triggerOverlay(currAlarm.type,website, FormatDuration(time), period));
          break;
        default:
          break;
      	}   
      }

      chrome.storage.sync.set({'History': History});
  } );
}

function HandleUpdate(tabId, changeInfo, tab) {
	if (changeInfo.status == 'complete'){
    Activate(tab.url, tabId); 
  }
}

function HandleActivated(activeInfo) {
	var tabId = activeInfo.tabId;
	var url;
	chrome.tabs.get(tabId, function(tab) {
		url = tab.url;
		Activate(url, tabId);
	});
}

function HandleIdle(newState) {
  if(newState == "locked" || newState == "idle") {
    //stop tracking time (used bug proof form, stop all tracking)
    
    //Ensure history exists. If it doesn't add starter history with just "*://*.google.com/*"
    chrome.storage.sync.get('History', function(data) {
	    if (data['History'] == null) {
	        History = {"*://*.google.com/*": {
                      total: {all: 0, day: 0, week: 0},
                      startDate: "",
                      alarms: []
                    };
	      } else {
	        History = data['History'];
	      }
	  
	    // bug catcher 
	    var date = new Date();

	    for (key in History) {
	      if (History[key].startDate != "") {
	        incrementTotals(History[key], date.getTime() - new Date(History[key].startDate).getTime());
	        History[key].startDate = "";
	      }
	    }

	    lastActive = "";

	    chrome.storage.sync.set({'History': History});
	});

  }
  else if(newState == "active") {
    chrome.tabs.query({ currentWindow: true, active: true }, function(tabs) {
    	tab = tabs[0];
      	Activate(tab.url, tab.id);
    });
  }
};

chrome.tabs.onUpdated.addListener(HandleUpdate);
chrome.tabs.onActivated.addListener(HandleActivated);
chrome.idle.onStateChanged.addListener(HandleIdle);
chrome.idle.setDetectionInterval(15);

chrome.runtime.onInstalled.addListener(function (object) {
   chrome.tabs.create({url: optionsURL}, function (tab) {
   });
});

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

function disableImages(matchPattern, reload = false) {  
  setPagePermission(matchPattern, chrome.contentSettings.images, 'block', reload);
}

function enableImages(matchPattern, reload = false) {  
  setPagePermission(matchPattern, chrome.contentSettings.images, 'allow', reload);
}

function disableScripts(matchPattern, reload = false) {  
  setPagePermission(matchPattern, chrome.contentSettings.javascript, 'block', reload);
}

function enableScripts(matchPattern, reload = false) {  
  setPagePermission(matchPattern, chrome.contentSettings.javascript, 'allow', reload);
}

function disableStyles(tabID, callback = null){
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, {command: 'modify_styles', setting: 'disable'}, 
    function(response) {
      callback
    });
  });
}

function enableStyles(tabID, callback){
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    chrome.tabs.sendMessage(tabID, {command: 'modify_styles', setting: 'enable'}, 
    function(response) {
      callback
    });
  });
}

function popup(){
  window.open("popup.html");
}

/*
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

*/

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
    /*document.getElementById('toggleJS').onclick = toggleScripts;
    document.getElementById('toggleIMG').onclick = toggleImages;
    document.getElementById('toggleStyles').onclick = toggleStyles; */
    document.getElementById('timeData').onclick = popup;
    document.getElementById('openAnalytics').onclick = openAnalytics;
    document.getElementById('openOptions').onclick = openOptions;
    document.getElementById('triggerWarning').onclick = triggerWarning;
});