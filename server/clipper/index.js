'use strict';

var express = require('express');
var clipRouter = express.Router();

clipRouter.route('/').post((req, res) => {
  console.log(req.body);
  res.sendStatus(200).end();
});

module.exports = clipRouter;
