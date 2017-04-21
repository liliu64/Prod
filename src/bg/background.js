// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });

var currTab;

var History = {"*://google.com/*": [0, new Date(),0]};

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
	var data = {};
	for (key in History) {
		data[key] = History[key][0];
	}
	return data;
}
function Update(date, tabId, url) {
  
    if (!url) {
    	return;
    }
  	if (date != "") {
	  var domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
	  domain = '*://'+domain+'/*';
	  if (domain in History) {
	    History[domain][0] += date.getTime() - new Date(History[domain][1]).getTime();
	    History[domain][1] = date;
	  } else {
	    History[domain] = [0,date,tabId];
	  }
	} else {
		date = new Date();
		var domain = url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
		domain = '*://'+domain+'/*';
	    if (domain in History) {
		    History[domain][0] += date.getTime() - new Date(History[domain][1]).getTime();
		    History[domain][1] = "";
		}
	}


}

function HandleUpdate(tabId, changeInfo, tab) {
  Update(new Date(), tabId, changeInfo.url);
}

function HandleRemove(tabId, removeInfo) {
  	var url = "";
  	for (domain in History) {
  		if (History[domain][2] == tabId) url = History[domain][2];
  	}
  	Update("", tabId, url);
}

function HandleReplace(addedTabId, removedTabId) {
  var t = new Date();
  chrome.tabs.get(addedTabId, function(tab) {
    Update(t, addedTabId, tab.url);
  });
}


chrome.tabs.onUpdated.addListener(HandleUpdate);
chrome.tabs.onRemoved.addListener(HandleRemove);
chrome.tabs.onReplaced.addListener(HandleReplace);

function reloadCurrentTab() {  
  chrome.tabs.reload();
}

function setCurrentPagePermission(feature, setting) {  
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    currTab = tabs[0].url + "/";
    var domain = currTab.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
    domain = '*://'+domain+'/*';
    alert(domain);
    feature.set({
      'primaryPattern': domain,
      'setting': setting
    });
    reloadCurrentTab();
  });
}

function disableImages() {  
  setCurrentPagePermission(chrome.contentSettings.images, 'block');
}

function enableImages() {  
  setCurrentPagePermission(chrome.contentSettings.images, 'allow');
}

function disableScripts() {  
  setCurrentPagePermission(chrome.contentSettings.javascript, 'block');
}

function enableScripts() {  
  setCurrentPagePermission(chrome.contentSettings.javascript, 'allow');
}

function disableStyles(){
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    alert(tabs[0].id);
    chrome.tabs.sendMessage(tabs[0].id, {command: 'modify_styles', setting: 'disable'}, 
    function(response) {
      //alert(response.numStyles);
    });
  });
}

function enableStyles(){
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
    alert(tabs[0].id);
    chrome.tabs.sendMessage(tabs[0].id, {command: 'modify_styles', setting: 'enable'}, 
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

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('toggleJS').onclick = toggleScripts;
    document.getElementById('toggleIMG').onclick = toggleImages;
    document.getElementById('toggleStyles').onclick = toggleStyles;
    document.getElementById('timeData').onclick = popup;
}); 