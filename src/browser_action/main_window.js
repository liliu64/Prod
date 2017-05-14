var analyticsURL   = chrome.runtime.getURL("/src/browser_action/analysis.html");
var optionsURL = chrome.runtime.getURL("/src/options/options.html");

function openOptions(){
  chrome.tabs.create({url: optionsURL});
}

function openAnalytics(){
  chrome.tabs.create({url: analyticsURL});
}

document.addEventListener('DOMContentLoaded', function () {
    /*document.getElementById('toggleJS').onclick = toggleScripts;
    document.getElementById('toggleIMG').onclick = toggleImages;
    document.getElementById('toggleStyles').onclick = toggleStyles; */
    document.getElementById('openAnalytics').onclick = openAnalytics;
    document.getElementById('openOptions').onclick = openOptions;
});