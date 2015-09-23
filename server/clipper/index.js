'use strict';

var express = require('express');
var cors = require('cors');
var clipRouter = express.Router();
var r = require('../db');
var auth = require('../auth');
var _ = require('lodash');
var mustache = require('consolidate').mustache;
var Promise = require('bluebird')
var fs = require('fs');
Promise.promisifyAll(fs);

var corsSetup = cors({
  origin : true,
  allowedHeaders : [ 'Content-Type', 'Authorization', 'Cache-Control' ],
  credentials : true,
  maxAge : 1
});

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  return res.status(401).send("You're not logged in.");
}

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
/*
Return value for existing pages is:

{ changes: [ { new_val: [Object], old_val: [Object] } ],
  deleted: 0,
  errors: 0,
  inserted: 0,
  replaced: 1,
  skipped: 0,
  unchanged: 0 }

For NEW pages is:

{ deleted: 0,
  errors: 0,
  generated_keys: [ 'f454837c-e64a-4c01-85ee-830be46b43cb' ],
  inserted: 1,
  replaced: 0,
  skipped: 0,
  unchanged: 0 }
*/

// r.db('passport_rethinkdb_tutorial').table('clippings').update(o=>{return {url: o('clippings').nth(0)('url')}})
// r.db('passport_rethinkdb_tutorial').table('clippings').update(o=>{return {title: o('clippings').nth(0)('title')}})
function render(id) {
  return r.table('clippings')
    .get(id)
    .run(r.conn)
    .then(obj => mustache('server/views/clipping.html', obj))
    .then(html => {
      // Write back to DB
      return r.table('clippings').get(id).update({html : html}).run(r.conn);
    })
    .catch(function(err) { throw err; });
}

function updateRenderOnDisk() {
  return r.table('clippings')
    .orderBy({index : r.desc('date')})('html')
    .reduce((left, right) => left.add(right))
    .run(r.conn)
    .then(html =>
            fs.writeFileAsync(__dirname + '/../../static/index.html', html));
}

function completeObj(obj, req) {
  obj.date = new Date();
  obj.isQuote = _.isBoolean(obj.isQuote) ? obj.isQuote : obj.isQuote === 'true';
  obj.urlOrTitle = obj.url || obj.title || "（ｕｎｔｉｔｌｅｄ）";
  obj.user = req.user;
  return obj;
}

clipRouter.get('/rerenderAll', ensureAuthenticated, (req, res) => {
  r.table('clippings')('id')
    .coerceTo('array')
    .run(r.conn)
    .then(ids => Promise.all(ids.map(render)))
    .then(tmp => updateRenderOnDisk())
    .then(() => res.status(200).send('Done'));
});

clipRouter.route('/')
  .options(corsSetup)
  .post(corsSetup, ensureAuthenticated, (req, res) => {
    var obj = completeObj(req.body, req);
    console.log('Incoming', obj);
    objToDb(obj).then(id => {
      res.status(200).send('OK');
      render(id).then(p => updateRenderOnDisk());
    });
  });

// curl -X POST https://localhost:4001/clip -d '{"hi":"THERE"}' -k -H
// "Content-Type: application/json"

module.exports = clipRouter;
