'use strict';

var express = require('express');
var clipRouter = express.Router();
var r = require('../db');

/*
  curl -X POST https://localhost:4001/clip -d '{"hi":"THERE"}' -k -H
  "Content-Type: application/json"
*/
clipRouter.route('/').post((req, res) => {
  var obj = req.body;
  console.log(obj);
  obj.urlOrTitle = obj.url || obj.title || "（ｕｎｔｉｔｌｅｄ）";
  obj.date = new Date();

  r.table('clippings')
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

    })  // Then send the DB's response to client
    .then(results => { res.json(results); });
});

module.exports = clipRouter;
