"use strict";
for (var n of document.getElementsByTagName('button')) {
  n.addEventListener('click', e => {
    var f = document.createElement('form');
    f.method = 'post';
    f.action = '/clip';
    var obj = {
      url : n.attributes.kurl.value,
      title : n.attributes.ktitle.value,
      source : "web submission",
      // Omit this: get it from DOM // selection : "",
      isQuote : false
    };
    for (var k in obj) {
      var i = document.createElement('input');
      i.setAttribute('name', k);
      i.setAttribute('value', obj[k]);
      i.setAttribute('type', 'hidden');
      f.appendChild(i);
    }
    var text = document.createElement('textarea');
    text.setAttribute('name', 'selection');
    text.setAttribute('placeholder', 'Add your comment…');
    f.appendChild(text);

    var submit = document.createElement('input');
    submit.setAttribute('type', 'submit');
    submit.setAttribute('value', 'Submit');
    f.appendChild(submit);

    e.target.parentNode.appendChild(f);

  });
}
