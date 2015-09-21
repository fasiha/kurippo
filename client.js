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
    selection : String(window.getSelection()),
    isQuote: true
  }));
})();

