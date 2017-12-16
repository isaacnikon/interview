var http = require('http');
var express = require('express');
var Session = require('express-session');
var google = require('googleapis');
var OAuth2 = google.auth.OAuth2;
var fs = require('fs');
var obj = require('./client_secret.json').web;
const ClientId = obj.client_id;
const ClientSecret = obj.client_secret;
const RedirectionUrl = "http://nikon93.xyz:1234/oauthCallback";
var app = express();
var  request  =  require('request');
var server = http.createServer(app);
var io = require('socket.io')(server);

var apiURL = 'https://www.googleapis.com/gmail/v1/users/me';

app.use(Session({
  secret: '7td8ycog48td8yd7tdy8gv97rd73s7rxitxifs7rxgovigx7rdigc8td7tfugsurs8d',
      resave: true,
      saveUninitialized: true
}));

function getOAuthClient() {
  return new OAuth2(ClientId,   ClientSecret, RedirectionUrl);
}

function getAuthUrl() {
  var oauth2Client = getOAuthClient();  // generate a url for gmail permission 
  var scopes = ['https://www.googleapis.com/auth/gmail.readonly'];
  var url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
        scope: scopes // If you only need one scope you can pass it as string
  });    
  return url;
}

app.get("/oauthCallback", function(req, res) {
  var oauth2Client = getOAuthClient();
  var session = req.session;
  var code = req.query.code;
  oauth2Client.getToken(code, function(err, tokens) { 
    // Now tokens contains an access_token and an optional refresh_token. Save them.
    if (!err) {
      oauth2Client.setCredentials = (tokens);
      session["tokens"] = tokens;
      io.on('connection', function(client) {
        client.id = code;
        client.emit('login', "successful");
        client.on('search', function(data) {
          if (client.id == code) {
						let messages= getListOfMessages(data);
            client.emit('tst', messages);
          }

        });







        client.on('event', function(data) {});
        client.on('disconnect', function() {});
      });
      res.sendFile(__dirname + "/views/loggedin.html");
    } else {
      res.send(`
            <h3>Login failed!!</h3>
        `);
    }
  });
});

function getListOfMessages(search,token,cb){
	token = '?access_token=' + token.access_token;
	let endpoint = '/messages';
	request(apiURL + endpoint + token + '&&q="in:anywhere" "thursday"',  function (error,  response,  body)  {
		let sendBody = '';
		console.log(body);
		JSON.parse(body).messages.forEach(function(message) {
			sendBody += `<a href='/details/${message.id}'>${message.snippet}</a>`
		});
		res.send(sendBody);
	});
}

app.get("/details/:messageID", function(req, res) {
  var oauth2Client = getOAuthClient();
  if (req.session["tokens"]) {
    let token = req.session["tokens"];
    oauth2Client.setCredentials = token;
    token = '?access_token=' + token.access_token;
    let endpoint = '/messages/';
    let url = apiURL + endpoint + req.paramas.messageID + token;
    request(url,  function (error,  response,  body)  {
      res.send(body);
    });
  } else {
    res.send("Error");
  }
});
app.get("/", function(req, res) {
  var url = getAuthUrl();
  res.send(`
        <h1>Authentication using google oAuth</h1>
        <a href=${url}>Login</a>
    `)
});
var port = 1234;
server.listen(port);
server.on('listening', function() {
  console.log(`listening to ${port}`);
});

 
