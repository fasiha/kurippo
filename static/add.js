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

function hasClass(str, substr) { return str.split(' ').indexOf(substr) >= 0; }
function buttonHandler(e) {
  var className = e.target.className;
  if (hasClass(className,'add-button')) {
    addCommentButtonHandler(e);

  } else if (hasClass(className, 'delete-button')) {
    var div = e.target.parentNode;
    var section = div.parentNode;
    restAPI('DELETE', `/clip/${section.id}`, '', refreshCallback);

  } else if (hasClass(className ,'sub-delete-button')) {
    var div = e.target.parentNode;
    var section = div.parentNode;
    var num = div.attributes.knum.value;
    restAPI('DELETE', `/clip/${section.id}/${num}`, '', refreshCallback);

  } else if (hasClass(className, 'intermission-add-button')) {
    var targetButton = e.target;
    var parentDiv = targetButton.parentNode;
    var section = parentDiv.parentNode;
    var numId = parentDiv.attributes.knum.value + '-' + section.id;
    // byebye button
    targetButton.remove();

    var div = document.createElement('div');
    div.id = 'div-' + numId;
    parentDiv.insertBefore(div, parentDiv.firstChild);

    var textarea = document.createElement('textarea');
    textarea.id = 'textarea-' + numId;
    div.appendChild(textarea);

    var button = document.createElement('button');
    button.textContent = "Submit";
    button.id = 'button-' + numId;
    button.addEventListener('click', intermissionDoneAddingButtonHandler);
    div.appendChild(button);
  }
}
function intermissionDoneAddingButtonHandler(ee) {
  var button = ee.target;
  var parentDiv = button.parentNode.parentNode;
  var section = parentDiv.parentNode;

  var obj = {
    source : "web submission",
    url : section.attributes.kurl.value,
    title : section.attributes.ktitle.value,
    selection :
      document.getElementById('textarea-' + parentDiv.attributes.knum.value +
                              '-' + section.id)
        .value,
    isQuote : false
  };

  var url = '/clip/' + section.id + '/' + parentDiv.attributes.knum.value;
  console.log(obj, url);
  restAPI('put', url, obj, refreshCallback);
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
var buttonsToHandle;
var dangerous = location.search.indexOf('debug') >= 0;
if (dangerous) {
  buttonsToHandle = document.getElementsByTagName('button');
} else {
  buttonsToHandle = document.getElementsByClassName('safe-button');
}
for (var n of buttonsToHandle) {
  n.addEventListener('click', buttonHandler);
  if (dangerous) { n.className = n.className.replace("hidden", "").trim(); }
}
