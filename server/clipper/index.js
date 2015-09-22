'use strict';

var express = require('express');
var cors = require('cors');
var clipRouter = express.Router();
var r = require('../db');
var auth = require('../auth');
var passport = require('passport');

var corsSetup = cors({
  origin : true,
  allowedHeaders : [ 'Content-Type', 'Authorization', 'Cache-Control' ],
  credentials : true,
  maxAge : 1
});

function objToDb(obj) {
  return r.table('clippings')
    .getAll(obj.urlOrTitle, {index : 'urlOrTitle'})
    .limit(1)
    .coerceTo('array')
    .run(r.conn)
    .then(results => {

      // Update an existing record by appending `obj`
      if (results.length > 0) {
        return r.table('clippings')
          .get(results[0].id)
          .update({date : obj.date, clippings : r.row('clippings').append(obj)})
          .run(r.conn);
      }

      // Brand new record: insert `obj`
      return r.table('clippings')
        .insert({
          date : obj.date,
          clippings : [ obj ],
          urlOrTitle : obj.urlOrTitle,
        })
        .run(r.conn);

    });
}

function completeObj(obj, req) {
  obj.date = new Date();
  obj.isQuote = obj.isQuote === 'true';
  obj.urlOrTitle = obj.url || obj.title || "（ｕｎｔｉｔｌｅｄ）";
  obj.user = req.user;
  return obj;
}

clipRouter.route('/')
  .options(corsSetup)
  .get(corsSetup, ensureAuthenticated,
       (req, res) => {
         var obj = completeObj(req.query, req);
         console.log('FROM', req.user, req.headers, 'SENT', obj);
         objToDb(obj).then(results => { res.json(results); });
       })
  .post(corsSetup, ensureAuthenticated, (req, res) => {
    var obj = completeObj(req.body, req);
    console.log('FROM', req.user, req.headers, 'SENT', obj);
    objToDb(obj).then(results => { res.json(results); });
  });

// curl -X POST https://localhost:4001/clip -d '{"hi":"THERE"}' -k -H
// "Content-Type: application/json"

/*
 * Works if you use 127.0.0.1 >.<
 */
clipRouter.route('/auth')
  .options(corsSetup)
  .post(
    (req, res, next) => {
      console.log(req.headers);
      next();
    },
    corsSetup, ensureAuthenticated,
    (req, res) => {
      var obj = req.body;
      obj.date = new Date();
      obj.urlOrTitle = obj.url || obj.title || "（ｕｎｔｉｔｌｅｄ）";
      console.log('FROM', req.authcode, req.user, req.headers, 'SENT', obj);
      res.json({resp : 'OK!'});
    })
  .get(corsSetup, true ? ensureAuthenticated : auth.checkIfLoggedIn,
       (req, res) => {
         console.log(req.headers);
         res.json({hi : 'there', user : req.user});
       });

function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  // return res.status(401).send("You're not logged in");
  return res.redirect('/?fwd=' + encodeURIComponent(req.originalUrl));
}

module.exports = clipRouter;
