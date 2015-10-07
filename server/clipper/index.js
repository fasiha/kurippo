'use strict';

var express = require('express');
var cors = require('cors');
var clipRouter = express.Router();
var r = require('../db');
var auth = require('../auth');
var _ = require('lodash');
var url = require('url');
var mustache = require('consolidate').mustache;
var moment = require('moment-timezone')
var Promise = require('bluebird')
var fs = require('fs');
Promise.promisifyAll(fs);

// See http://www.restapitutorial.com/lessons/httpmethods.html for advice on
// verbs and HTTP return codes. Also see
// http://rethinkdb.com/api/javascript/delete/ for delete()'s reply.

// Middleware to allow POST/PUT/DELETE/GET requests to reuse cookie
// authentication (see `XMLHttpRequest.withCredentials`).  Thanks to
// http://mortoray.com/2014/04/09/allowing-unlimited-access-with-cors/ for hints
// on what headers to allow. Thankfully cors module does all the hard work.
var corsSetup = cors({
  origin : true,
  allowedHeaders : [ 'Content-Type', 'Authorization', 'Cache-Control' ],
  credentials : true,
  maxAge : 1
});

// Render an individual document (top-level clipping), full list of
// documents, and helpers
function dateToString(date) {
  return moment.tz(new Date(date), 'America/New_York')
    .format('ddd YYYY MMM DD HH:mm:ss zz');
}

function render(id) {
  return r.table('clippings')
    .get(id)
    .run(r.conn)
    .then(obj => {
      obj.date = dateToString(obj.date);
      obj.clippings.forEach((o, i) => {
        o.date = dateToString(o.date);
        o.num = i;
        o.selection = o.selection.replace(/\n[ \t]*\n[ \t]*(\n[ \t]*)*/g, '\n\n');
      });
      return mustache('server/views/clipping.html', obj);
    })
    .then(html => {
      // Write back to DB
      return r.table('clippings').get(id).update({html : html}).run(r.conn);
    })
    .catch(function(err) { throw err; });
}

function updateRenderOnDisk() {
  return r.table('clippings')
    .orderBy({index : r.desc('date')})('html')
    .coerceTo('array')
    .reduce((left, right) => left.add(right))
    .run(r.conn)
    .then(html => mustache('server/views/all-clippings.html', {body : html}))
    .then(html =>
            fs.writeFileAsync(__dirname + '/../../static/index.html', html));
}

// Route asking us to re-render everything. Useful when I change the template,
// e.g.
clipRouter.get('/rerenderAll', auth.ensureAuthenticated, (req, res) => {
  r.table('clippings')('id')
    .coerceTo('array')
    .run(r.conn)
    .then(ids => Promise.all(ids.map(render)))  // FIXME makes O(n) db lookups
    .then(tmp => updateRenderOnDisk())
    .then(() => res.status(200).send('Done'))
    .catch(err => {
      res.status(400).send('Unknown error');
      console.error(err);
    });
});

// Helper functions to prep a POSTed object to be enrolled in the db
function objToDb(obj) {
  return r.table('clippings')
    .getAll(obj.urlOrTitle, {index : 'urlOrTitle'})
    .limit(1)
    .pluck('id')
    .coerceTo('array')
    .run(r.conn)
    .then(results => {

      // Update an existing record by appending `obj`
      if (results.length > 0) {
        return r.table('clippings')
          .get(results[0].id)
          .update({date : obj.date, clippings : r.row('clippings').append(obj)},
                  {returnChanges : true})
          .run(r.conn)
          .then(report => {
            console.log('Db report:', report);
            return report.changes[0].new_val.id
          });
      }

      // Brand new record: insert `obj`.

      // Note that, for clippings with URLs, the title will stay fixed (won't
      // update when a URL's title changes in a subsequent clipping).
      return r.table('clippings')
        .insert({
          date : obj.date,
          clippings : [ obj ],
          urlOrTitle : obj.urlOrTitle,
          url : obj.url,
          title : obj.title,
          html : ''
        })
        .run(r.conn)
        .then(report => {
          console.log('Db report:', report);
          return report.generated_keys[0];
        });
    });
}

function completeObj(obj, req) {
  obj.date = new Date();
  obj.isQuote = _.isBoolean(obj.isQuote) ? obj.isQuote : obj.isQuote === 'true';
  var urlNoHash = obj.url ? _.omit(url.parse(obj.url),'hash').format() : '';
  obj.urlOrTitle = urlNoHash || obj.title || "（ｕｎｔｉｔｌｅｄ）";
  obj.user = req.user;
  return obj;
}

// Route to post new content. Follows
// http://www.restapitutorial.com/lessons/httpmethods.html for advice on verbs
// and HTTP return codes. Also see http://rethinkdb.com/api/javascript/delete/
// for delete()'s reply.
clipRouter.route('/').options(corsSetup).post(
  corsSetup, auth.ensureAuthenticated, (req, res) => {
    var obj = completeObj(req.body, req);
    console.log('Incoming', obj);
    objToDb(obj)
      .then(id => {
        // Send reply before bothering to update the disk, since client probably
        // isn't waiting to refresh.
        res.status(200).send('OK');
        render(id).then(p => updateRenderOnDisk());
      })
      .catch(err => {
        res.status(400).send('Unknown error');
        console.error(err);
      });
  });

// Route to delete an entire document.
clipRouter.route('/:id').options(corsSetup).delete(
  corsSetup, auth.ensureAuthenticated,
  (req, res) => r.table('clippings')
                  .get(req.params.id)
                  .delete()
                  .run(r.conn)
                  .then(dbreply => dbreply.deleted > 0
                                     ? updateRenderOnDisk().then(
                                         () => res.status(200).send('Deleted'))
                                     : res.status(404).send('Not found'))
                  .catch(err => {
                    res.status(400).send('Unknown error');
                    console.error(err);
                  }));

// Route to delete an individual sub-clipping (sub-document).  `deleteAt`
// returns the array without the element in question. But if it can't find that
// element (out-of-bounds), `update().errors` will be >0. Or, if it can't find
// the document `id`, `update().errors` will be 0 but `.skipped` will be 1. If
// all went well, `update().replaced` will be >0.
function deleteOrInsertSubClipping(req, res, method) {
  var updated;
  if (method === 'delete') {
    updated = {clippings : r.row('clippings').deleteAt(+req.params.clipNum)};
  } else if (method === 'put') {
    var obj = completeObj(req.body, req);
    updated = {
      clippings : r.row('clippings').insertAt(+req.params.clipNum, obj),
      date : obj.date
    };
  } else {
    console.error(
      'deleteOrInsertSubClipping only understands `delete` or `put`, not ' +
      method);
    res.status(400).send('Internal error');
  }

  return r.table('clippings')
    .get(req.params.id)
    .update(updated)
    .run(r.conn)
    .then(dbreply => dbreply.replaced > 0
                       ? render(req.params.id)
                           .then(updateRenderOnDisk)
                           .then(() => res.status(200).send('OK'))
                       : res.status(404).send(dbreply.errors > 0
                                                ? 'Subdocument not found'
                                                : 'Document not found'))
    .catch(err => {
      res.status(400).send('Unknown error');
      console.error(err);
    });
}
clipRouter.route('/:id/:clipNum')
  .options(corsSetup)
  .delete(corsSetup, auth.ensureAuthenticated,
          (req, res) => deleteOrInsertSubClipping(req, res, 'delete'))
  .put(corsSetup, auth.ensureAuthenticated,
       (req, res) => deleteOrInsertSubClipping(req, res, 'put'));

// curl -X POST https://localhost:4001/clip -d '{"hi":"THERE"}' -k -H
// "Content-Type: application/json"

module.exports = clipRouter;
