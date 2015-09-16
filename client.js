(() => {
  var req = new XMLHttpRequest();
  req.onreadystatechange = (() => {
    console.log(req.readyState || 'no readyState', req.status || 'no status',
                req.responseText || 'no responseText');
  });
  req.open('POST', 'https://localhost:4001/clip', true);
  req.setRequestHeader('Content-Type', 'application/json');
  req.setRequestHeader('Cache-Control', 'no-cache');
  req.send(JSON.stringify({
    source : 'clipper',
    url : document.location.href,
    title : document.title,
    selection : String(window.getSelection())
  }));
})();

// Instaldebrn
function win(){return window.open(
    '', 'smallwin',
    'width=400,height=400,status=1,toolbar=0,resizable=0,scrollbars=0')};
function foo() {
  var d = document, w = window, l = d.location, e = window.getSelection,
      k = d.getSelection, x = d.selection,
      s = String(e ? e() : (k) ? k() : (x ? x.createRange().text : '')),
      e = encodeURIComponent, f = d.createElement('form');
  if (s.length < 1) {
    function selframe() {
      var foo = '';
      for (var i = 0; i < self.frames.length; i) {
        s = String(window.frames[i].getSelection());
        if (s && s.length > foo.length) {
          foo = s
        }
      };
      return foo;
    };
    s = selframe()
  };
  f.method = 'post';
  f.action = 'http://instaldebrn.appspot.com/submit_entry';
  var arr = {remote : 1, contents : e(s), url : e(l.href), title : e(d.title)};
  for (var k in arr) {
    var i = d.createElement('input');
    i.setAttribute('name', k);
    i.setAttribute('value', arr[k]);
    i.setAttribute('type', 'hidden');
    f.appendChild(i)
  }
  ww = win();
  ww.document.write('standby');
  ww.document.body.appendChild(f);
  f.submit();
};
foo();
void(0)


