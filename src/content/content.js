chrome.runtime.onMessage.addListener(function (msg, sender, sendResponse) {
    if (msg.command === 'modify_styles') {
      var targetStatus = (msg.setting === 'disable');
      for(i=0;i<document.styleSheets.length;i++){
        document.styleSheets.item(i).disabled=targetStatus;
      }
      sendResponse({numStyles: "" + document.styleSheets.length});
    }
});