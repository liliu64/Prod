var analyticsURL   = chrome.runtime.getURL("/src/browser_action/analysis.html");
var optionsURL = chrome.runtime.getURL("/src/options/options.html");

var currTab;

/*

  URL: {
    total: {
      a: int
      d: int
      w: int
    } 
    startDate: date
    alarms:
      {
        duration: int
        type: string
        per: string
        enabled: boolean
      }
    ]
  }

*/
var History = {};
var lastActive = "";

/* Legacy Debug Code: here for debugging
var styles = true;
var images = true;
var scripts = true;
*/

//Tracking Reset Times
var midnight = new Date();
//midnight.setHours(24,0,0,0);
midnight.setHours(24,00,0,0);

//Cite: https://stackoverflow.com/questions/11789647/setting-day-of-week-in-javascript
var sundayMidnight = new Date();
var sunday = 0;
var currentDay = sundayMidnight.getDay();
var delta = Math.abs(sunday + 6 - currentDay);
sundayMidnight.setDate(sundayMidnight.getDate() + delta);
sundayMidnight.setHours(24,00,0,0);
//alert(sundayMidnight.toString())
//alert(midnight.toString())

/*
  Return the total time spent on each page, for visualization
*/
function getTotals() {
	var output = {};
	for (key in History) {
		output[key] = History[key].total;
	}
	return output;
}

/*
  Given a bare domain, return a proper Chrome match Pattern
*/
function wrapDomain (domain) {
  return '*://*.'+domain+'/*';
}

/*
  Given a proper Chrome match Pattern, return a bare domain
*/
function unWrapDomain (domain) {
  return domain.replace('*://*.', '').replace('/*', '');
}

/*
  Incremement the time spent on a website <urlObj> by <amount> (in ms). 
*/
function incrementTotals (urlObj, amount) {
  urlObj.total.a += amount;
  urlObj.total.d += amount;
  urlObj.total.w += amount;
}

/*
  Handler for when pages are made active through any mean. Stop tracking the last active
  page time, start tracking the new active page time, check for any expired alarms
  on the current active page time and take any actions with them if needed
*/
function Activate(url, tabId) {
  chrome.storage.sync.get('History', function(data) {
    //Ensure history exists. If it doesn't add starter history with just "*://*.google.com/*"
    if (data['History'] == null) {
        History = {"*://*.google.com/*": 
                    {
                      total: {a: 0, d: 0, w: 0},
                      startDate: "",
                      alarms: []
                    } 
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
        History[domain] = { total: {a: 0, d: 0, w: 0},
                            startDate: date.toJSON(),
                            alarms: []
                          };
      }

      var website = unWrapDomain (domain);

      //Get the alarm with largest time
      var maxIndex = -1;
      var maxHours = 0; 
      for (var i = 0; i < History[domain].alarms.length; i++) {
        currAlarm = History[domain].alarms[i];
        var time = currAlarm.duration;
        var per = currAlarm.per
        if (time > 0 && currAlarm.enabled) {
          //60000 ms per minute
          if (History[domain].total[currAlarm.per] > time) {
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

        //Trigger overlay and enforce any alarm actions
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

/*
  Handle the tab being changed
*/
function HandleUpdate(tabId, changeInfo, tab) {
	if (changeInfo.status == 'complete'){
    Activate(tab.url, tabId); 
  }
}

/*
  Handle the current tab being brought back into focus
*/
function HandleActivated(activeInfo) {
	var tabId = activeInfo.tabId;
	var url;
	chrome.tabs.get(tabId, function(tab) {
		url = tab.url;
		Activate(url, tabId);
	});
}

/*
  Handle idle state transitions (user inactive or computer turned off/asleep)
*/
function HandleIdle(newState) {
  if(newState == "locked" || newState == "idle") {
    //stop tracking time (used bug proof form, stop all tracking)
    
    //Ensure history exists. If it doesn't add starter history with just "*://*.google.com/*"
    chrome.storage.sync.get('History', function(data) {
	    if (data['History'] == null) {
	        History = {"*://*.google.com/*": 
                      {
                        total: {a: 0, d: 0, w: 0},
                        startDate: "",
                        alarms: []
                      } 
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

//Reset Timers
function resetTimers(alarmInfo) {
  //alert("TIMER");
  if(alarmInfo.name === "resetDay"){
    //alert("MIDNIGHT");
    chrome.storage.sync.get('History', function(data) {
      History = data['History'];
      for (key in History) {
        //console.log(JSON.stringify(key));
        //console.log(JSON.stringify(History[key]));
        History[key].total.d = 0; //Reset Timer
        
        //Reenable any disabled functionality
        for(i in History[key].alarms) {
          if(History[key].alarms[i].per == "d") {
            //alert(JSON.stringify(History[key].alarms[i]));
            switch (History[key].alarms[i].type) {
            case "images":
              enableImages(key, false);
              break;
            case "scripts":
              enableScripts(key, false);
              break;
            default:
              break;
            }
          }
        }
      }
      chrome.storage.sync.set({'History': History});
    });
  }
  else if(alarmInfo.name === "resetWeek") {
    //alert("SUNDAY_MIDNIGHT");
    for (key in History) {
      chrome.storage.sync.get('History', function(data) {
        History = data['History'];
        for (key in History) {
          //console.log(JSON.stringify(key));
          //console.log(JSON.stringify(History[key]));
          History[key].total.w = 0; //Reset Timer
        
          //Reenable any disabled functionality
          for(i in History[key].alarms) {
            if(History[key].alarms[i].per == "w") {
              switch (History[key].alarms[i].type) {
              case "images":
                enableImages(key, false);
                break;
              case "scripts":
                enableScripts(key, false);
                break;
              default:
                break;
              }
            }
          }
        }
        chrome.storage.sync.set({'History': History});
      });
    }
  }
}

//Event Listeners
chrome.tabs.onUpdated.addListener(HandleUpdate);
chrome.tabs.onActivated.addListener(HandleActivated);
chrome.idle.onStateChanged.addListener(HandleIdle);
chrome.idle.setDetectionInterval(300);
chrome.alarms.onAlarm.addListener(resetTimers);
chrome.runtime.onInstalled.addListener(function (object) {
   chrome.tabs.create({url: optionsURL}, function (tab) {
   });
});

//Alarms (for resetting totals)
chrome.alarms.create("resetDay", {
       when: midnight.valueOf(), periodInMinutes: 1440});
       
chrome.alarms.create("resetWeek", {
       when: sundayMidnight.valueOf(), periodInMinutes: 10080});

function reloadCurrentTab() {  
  chrome.tabs.reload();
}

function setCurrentPagePermission(feature, setting) {  
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    currTab = tabs[0].url + "/";
    var domain = currTab.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
    if (domain.substring(0,4) == 'www.') domain = domain.substring(4,domain.length);
    domain = '*://'+domain+'/*';
    //alert(domain);
    feature.set({
      'primaryPattern': domain,
      'setting': setting
    });
    reloadCurrentTab();
  });
}

//Functions that enforce rules
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

function enableStyles(tabID, callback = null){
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

/* //Debug Toggles
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