// if you checked "fancy-settings" in extensionizr.com, uncomment this lines

// var settings = new Store("settings", {
//     "sample_setting": "This is how you use Store.js to remember values"
// });

var currTab;

var styles = true;
var images = true;
var scripts = true;

//example of using a message handler from the inject scripts
chrome.extension.onMessage.addListener(
  function(request, sender, sendResponse) {
  	chrome.pageAction.show(sender.tab.id);
    sendResponse();
  });

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

function triggerOverlay(type, url, time){
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
      chrome.tabs.sendMessage(tabs[0].id, {command: 'display_message', 
                            setting: type,
                            url: url,
                            time: time}, 
      function(response) {
    });
  });
}

function triggerWarning(){
  chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
        var domain = tabs[0].url.match(/^[\w-]+:\/{2,}\[?([\w\.:-]+)\]?(?::[0-9]*)?/)[1];
        triggerOverlay('warning', domain, '9');
  });
}

document.addEventListener('DOMContentLoaded', function () {
    document.getElementById('toggleJS').onclick = toggleScripts;
    document.getElementById('toggleIMG').onclick = toggleImages;
    document.getElementById('toggleStyles').onclick = toggleStyles;
    document.getElementById('triggerWarning').onclick = triggerWarning;
}); 