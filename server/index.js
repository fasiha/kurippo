/*jshint node:true */
'use strict';

var fs = require('fs');
var http = require('http');
var https = require('https');
var bodyParser = require('body-parser');
var cors = require('cors');
var morgan = require('morgan');
var cookieParser = require('cookie-parser');

var config = require('config');
var express = require('express');
var session = require('express-session');
var RDBStore = require('express-session-rethinkdb')(session);
var engines = require('consolidate');

var app = express();
var auth = require('./auth');
var authRouter = require('./auth/auth-router');
var clipRouter = require('./clipper');

// Middleware
app.set('x-powered-by', false);
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// app.use(cors()); // Apply in routers
app.use(morgan('combined'));
app.use(cookieParser());
app.use(session({
     secret : 'zfnzkwjehgweghw',
     resave : false,
     saveUninitialized : true,
     store : new RDBStore({
       connectOptions : {
         servers : [
           {
             host : config.get('rethinkdb').host,
             port : config.get('rethinkdb').port
           }
         ],
         db : config.get('rethinkdb').db
       },
       table : 'session'
     })
   }))
  .use(auth.initialize())
  .use(auth.session());

// Views
app.set('views', __dirname + '/views')
    .engine('html', engines.mustache)
    .set('view engine', 'html');

// Routes
app.use('/auth', authRouter)
  .get('/', function(req, res) { res.render('index.html', {user : req.user}); })
  .get('/test', auth.checkIfLoggedIn,
       (req, res) => { res.json({hi : 'there', user : req.user}); })
  .use('/clip', clipRouter)
  .use(express.static(__dirname + '/../client'))
  .use('*',
       function(req, res) { res.status(404).send('404 Not Found').end(); });

https.createServer(
       {
         key :
           fs.readFileSync(__dirname + '/../certs/server/my-server.key.pem'),
         cert :
           fs.readFileSync(__dirname + '/../certs/server/my-server.crt.pem'),
         requestCert : false,
         rejectUnauthorized : true
       },
       app)
  .listen(config.get('ports').https, () => {
    console.log(`HTTPS live at https://localhost:${config.get('ports').https}`);
  });

var insecureApp = express();
insecureApp.get(
    '*',
    (req, res) => {res.redirect(
        `${config.get('protocol')}://${config.get('url')}:${config.get('ports').https}`)});
http.createServer(insecureApp)
    .listen(config.get('ports').http,
            () => {console.log(`HTTP live at http://localhost:${config.get('ports').http}`)});

