var fs = require('fs');
var v = fs.readFileSync('instaldebrn.json','utf8').trim().split('\n').map(JSON.parse);
var dodate = s => new Date(s.replace(' ', 'T') + 'Z').toISOString();
v.forEach((o, i) => {
  o.title = decodeURIComponent(o.title);
  o.date = dodate(o.date);
  o.clippings.forEach(p => {
    p.selection = decodeURIComponent(p.selection);
    p.date = dodate(p.date);
  });
});

