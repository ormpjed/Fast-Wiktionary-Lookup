browser.action.onClicked.addListener(inject);
browser.runtime.onMessage.addListener(processMessage);

function inject(tab) {
  browser.scripting.executeScript({
    target: {tabId: tab.id},
    files: ["injectPanel.js"]
  });
}

function processMessage(message, sender, sendResponse) {
  if (!message.request) {
    return;
  }

  if (message.request === 'fetch' && message.url) {
    fetchPage(message.url, sendResponse);
    return true;
  } else if (message.request === 'set' && message.key && message.value) {
    set(message.key, message.value);
  } else if (message.request === 'get' && message.key) {
    get(message.key, sendResponse);
    return true;
  }
}

function set(key, value) {
  browser.storage.local.set({[key]: value});
}

function get(key, sendResponse) {
  browser.storage.local.get(key)
    .then(
      value => {
        sendResponse(value);
      },
      reason => {
        sendResponse(null);
      }
    );
}

function fetchPage(url, sendResponse) {
  fetch(url)
    .then(
      value => value.json(),
      reason => {
        sendResponse(null)
      }
    )
    .then(
      value => {
        sendResponse(value);
      },
      reason => {
        sendResponse(null)
      }
    );
}
