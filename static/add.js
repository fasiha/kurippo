"use strict";

var refreshCallback = xhr => window.setTimeout(() => location.reload(), 1000);

function restAPI(method, url, obj, callback) {
  var req = new XMLHttpRequest();
  req.onreadystatechange = (() => {
    console.log(req.readyState || 'no readyState', req.status || 'no status',
                req.responseText || 'no responseText');
    if (callback && req.readyState === 4) { callback(req); }
  });
  req.open(method, url, true);
  if (obj) { req.setRequestHeader('Content-Type', 'application/json'); }
  req.withCredentials = true;
  req.send(JSON.stringify(obj || ''));
}

function postComment(obj, callback) { restAPI('POST', '/clip', obj, callback); }

function buttonHandler(e) {
  var className = e.target.className;
  if (className === 'add-button') {
    addCommentButtonHandler(e);

  } else if (className === 'delete-button') {
    var div = e.target.parentNode;
    var section = div.parentNode;
    restAPI('DELETE', `/clip/${section.id}`, '', refreshCallback);

  } else if (className === 'sub-delete-button') {
    var div = e.target.parentNode;
    var section = div.parentNode;
    var num = e.target.attributes.knum.value;
    restAPI('DELETE', `/clip/${section.id}/${num}`, '', refreshCallback);
  }
}

function addCommentButtonHandler(e) {
  var section = e.target.parentNode.parentNode;  // FIXME

  var div = document.createElement('div');
  div.id = 'div-' + section.id;
  section.appendChild(div);

  var textarea = document.createElement('textarea');
  textarea.id = 'textarea-' + section.id;
  div.appendChild(textarea);

  var button = document.createElement('button');
  button.textContent = "Submit";
  button.id = 'button-' + section.id;
  button.addEventListener('click', doneAddingButtonHandler);
  div.appendChild(button);
}

function doneAddingButtonHandler(ee) {
  var button = ee.target;
  var div = button.parentNode;
  var section = div.parentNode;

  var obj = {
    source : "web submission",
    url : section.attributes.kurl.value,
    title : section.attributes.ktitle.value,
    selection : document.getElementById('textarea-' + section.id).value,
    isQuote : false
  };

  console.log(obj);
  postComment(obj, refreshCallback);
}

// Append `?debug` to the URL to see the delete buttons.
var buttonsToHandle = [];
var dangerous = location.search.indexOf('debug') >= 0;
if (dangerous) {
  buttonsToHandle = document.getElementsByTagName('button');
} else {
  buttonsToHandle = document.getElementsByClassName('add-button');
}
for (var n of buttonsToHandle) {
  n.addEventListener('click', buttonHandler);
  if (dangerous) { n.className = n.className.replace("hidden", ""); }
}
