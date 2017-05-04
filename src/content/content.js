var logoURL = chrome.runtime.getURL("../../img/ProdLogo.png");
var optionsURL = chrome.runtime.getURL("src/options/options.html");

var strings = {
  titles: {
    warning: ["Maybe you should get back to work?",
              "Time to start being productive?",
              "Oh nooeesss! Too much procrastination?",
              "You've been warned..."],
    images:  ["Well, this is a bit more boring",
              "No more pics. No more gifs.",
              "Where'd all the catz go!?!??",
              "Help! I'm blind!"],
    styles:  ["No More Pretty :(",
              "Welcome to dial-up mode",
              "Appreciate web designers now?",
              "I hear your work still looks nice ;)"],
    scripts: ["Bye Bye Scripts",
              "Welcome to Web 1.0",
              "Gonna be hard to procrastinate here...",
              "Remember simpler times?"] 
  },
  body: "You have reached your <span id='prod-time'></span>/<span id='prod-unit'></span>\
         <span id='prod-type'></span> limit on <span id='prod-url'></span>. \
         You can update this policy at your Prod Control Panel."
};

var overlayContents = "<div class = 'overlay-head'> \
                          <h1 id='prod-title'>Title</h1> \
                          <img class = 'prod-logo' src=" + logoURL +"> \
                       </div>\
                       <p id='prod-message'>text</p>\
                       <button class = 'btn-overlay btn-prod' id='dismiss'>Dismiss</button>\
                       <button class = 'btn-overlay btn-prod' id='options'> \
                       Prod Control Panel</button>";
                       
function removeOverlay() {
  document.getElementById("prod-alert").remove();
}

function openOptions(){
  window.open(optionsURL, '_blank');
  removeOverlay();
}

chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.command === 'modify_styles') {
      var targetStatus = (msg.setting === 'disable');
      for(i=0;i<document.styleSheets.length;i++){
        document.styleSheets.item(i).disabled=targetStatus;
      }
      sendResponse({numStyles: "" + document.styleSheets.length});
    }
    else if (msg.command === 'display_message') {
      var oldOverlay = document.getElementById("prod-alert");
      if(oldOverlay) oldOverlay.remove();
      var overlay  = document.createElement("div");
      document.body.appendChild(overlay);
      overlay.innerHTML = overlayContents;
      overlay.className+= " prod-overlay";
      overlay.id = "prod-alert";
      
      var titles = strings.titles[msg.setting];
      var index = Math.floor(Math.random() * titles.length);
      document.getElementById("prod-title").innerText = titles[index];
      document.getElementById("prod-message").innerHTML = strings.body;
      document.getElementById("prod-time").innerText = msg.time;
      document.getElementById("prod-unit").innerText = msg.unit;
      document.getElementById("prod-type").innerHTML = msg.setting;
      document.getElementById("prod-url").innerHTML = msg.url;
      document.getElementById("dismiss").onclick = removeOverlay;
      document.getElementById("options").onclick = openOptions;
    }
});