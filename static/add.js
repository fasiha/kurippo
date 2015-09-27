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

  if (hasClass(className, 'delete-button')) {
    var div = e.target.parentNode;
    var section = div.parentNode;
    restAPI('DELETE', `/clip/${section.id}`, '', refreshCallback);

  } else if (hasClass(className, 'sub-delete-button')) {
    var div = e.target.parentNode;
    var section = div.parentNode;
    var num = div.attributes.knum.value;
    restAPI('DELETE', `/clip/${section.id}/${num}`, '', refreshCallback);

  } else if (hasClass(className, 'intermission-add-button') ||
             hasClass(className, 'final-add-button')) {
    var intermediate =
      hasClass(className, 'intermission-add-button');  // if false, it's final!

    var targetButton = e.target;
    var parentNode = targetButton.parentNode;
    var section = parentNode.parentNode;
    var numId = (intermediate ? parentNode.attributes.knum.value : 'final') +
                '-' + section.id;
    // byebye button
    targetButton.remove();

    var div = document.createElement('div');
    div.id = 'div-' + numId;
    parentNode.insertBefore(div, parentNode.firstChild);

    var textarea = document.createElement('textarea');
    textarea.id = 'textarea-' + numId;
    div.appendChild(textarea);

    var button = document.createElement('button');
    button.textContent = "Submit";
    button.id = 'button-' + numId;
    button.addEventListener('click', intermediate
                                       ? intermissionDoneAddingButtonHandler
                                       : finalDoneAddingButtonHandler);
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
function finalDoneAddingButtonHandler(ee) {
  var button = ee.target;
  var parentNode = button.parentNode.parentNode;
  var section = parentNode.parentNode;

  var obj = {
    source : "web submission",
    url : section.attributes.kurl.value,
    title : section.attributes.ktitle.value,
    selection : document.getElementById('textarea-final-' + section.id).value,
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
