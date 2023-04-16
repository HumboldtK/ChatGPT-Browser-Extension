chrome.runtime.onInstalled.addListener(function() {
    chrome.contextMenus.removeAll(function() {
      chrome.contextMenus.create({
        title: "Ask GPT",
        id: "askGPT",
        contexts: ["selection"],
      });
      chrome.contextMenus.create({
        title: "Summarize",
        parentId: "askGPT",
        id: "summarize",
        contexts: ["selection"],
      });
      chrome.contextMenus.create({
        title: "Explain",
        parentId: "askGPT",
        id: "explain",
        contexts: ["selection"],
      });
      chrome.contextMenus.create({
        title: "Quick Reply",
        parentId: "askGPT",
        id: "quickReply",
        contexts: ["selection"],
      });
    });
  });
  
  chrome.contextMenus.onClicked.addListener(function(info, tab) {
    if (info.menuItemId === "summarize") {
      openPopupWithQuestion("Briefly summarize this, ", info.selectionText);
    } else if (info.menuItemId === "explain") {
      openPopupWithQuestion("Explain this to me in a few sentences, ", info.selectionText);
    } else if (info.menuItemId === "quickReply") {
      openPopupWithQuestion("Provide a good quick reply to this, ", info.selectionText);
    }
  });
  
  function openPopupWithQuestion(prompt, selectedText) {
    chrome.storage.local.set({question: prompt + selectedText}, function() {
      chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"),
        type: "popup"
      }, function(newWindow) {
        chrome.windows.update(newWindow.id, {
          width: 590,
          height: 645
        });
      });
    });
  }
  

  chrome.runtime.onConnect.addListener(function(port) {
    if (port.name === "popup") {
        port.onMessage.addListener(function(msg) {
            if (msg.action === "getQuestion") {
                chrome.storage.local.get("question", function(data) {
                    port.postMessage({action: "setQuestion", question: data.question});
                });
            }
        });
    }
});

