
var http = require('http');

var express = require('express');

var Session = require('express-session');

var google = require('googleapis');

var OAuth2 = google.auth.OAuth2;

var fs = require('fs'); 

var obj = require('./client_secret.json').installed;

console.log(obj);
const ClientId = obj.client_id;

const ClientSecret = obj.client_secret;

const RedirectionUrl = "http://localhost:1234/oauthCallback";


var app = express();

app.use(Session({

    secret: '7td8ycog48td8yd7tdy8gv97rd73s7rxitxifs7rxgovigx7rdigc8td7tfugsurs8d',

    resave: true,

    saveUninitialized: true

}));

 

function getOAuthClient () {

    return new OAuth2(ClientId ,  ClientSecret, RedirectionUrl);

}

 

function getAuthUrl () {

    var oauth2Client = getOAuthClient();

    // generate a url for gmail permission

    var scopes = [

      'https://mail.google.com/'

    ];

 

    var url = oauth2Client.generateAuthUrl({

        access_type: 'offline',

        scope: scopes // If you only need one scope you can pass it as string

    });

 

    return url;

}

 

app.use("/oauthCallback", function (req, res) {

    var oauth2Client = getOAuthClient();

    var session = req.session;

    var code = req.query.code;

    oauth2Client.getToken(code, function(err, tokens) {

      // Now tokens contains an access_token and an optional refresh_token. Save them.

      if(!err) {

        oauth2Client.setCredentials=(tokens);

        session["tokens"]=tokens;

        res.send(`

            <h3>Login successful!!</h3>

            <a href="/details">Go to details page</a>

        `);

      }

      else{

        res.send(`

            <h3>Login failed!!</h3>

        `);

      }

    });

});

 

app.use("/details", function (req, res) {

    var oauth2Client = getOAuthClient();

    oauth2Client.setCredentials=(req.session["tokens"]);

 				console.log(req.session["tokens"]);
				var request = require('request');

request('https://www.googleapis.com/gmail/v1/users/me/messages?access_token='+req.session["tokens"].access_token, function (error, response, body) {

  console.log('error:', error); // Print the error if one occurred

  console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received

  console.log('body:', body); // Print the HTML for the Google homepage.
		res.send(body);
});



    

});

 

app.use("/", function (req, res) {

    var url = getAuthUrl();

    res.send(`

        <h1>Authentication using google oAuth</h1>

        <a href=${url}>Login</a>

    `)

});

 

 

var port = 1234;

var server = http.createServer(app);

server.listen(port);

server.on('listening', function () {

    console.log(`listening to ${port}`);

});

 

