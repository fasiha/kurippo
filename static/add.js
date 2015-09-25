"use strict";

function sendify(obj, callback) {
  var req = new XMLHttpRequest();
  req.onreadystatechange = (() => {
    console.log(req.readyState || 'no readyState', req.status || 'no status',
                req.responseText || 'no responseText');
    if (callback && req.readyState === 4) { callback(); }
  });
  req.open('POST', '/clip', true);
  req.setRequestHeader('Content-Type', 'application/json');
  req.withCredentials = true;
  req.send(JSON.stringify(obj));
}



function addCommentButtonHandler(e) {
  var section = e.target.parentNode.parentNode; // FIXME

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
  sendify(obj, () => { window.setTimeout(() => location.reload(), 1000); });
}

for (var n of document.getElementsByTagName('button')) {
  n.addEventListener('click', addCommentButtonHandler);
}
