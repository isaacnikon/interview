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
var bodyParser = require('body-parser');
var sync = require('synchronize');
var base64 = require('base64url');
var apiURL = 'https://www.googleapis.com/gmail/v1/users/me';
var {
  sendMessage
} = require('./twilio.js')
app.use(bodyParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded());
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
            sync.fiber(function() {
              let messages = getListOfMessages(data, tokens);
              console.log(messages);
              client.emit('messages', messages);
            });
          }
        });
        client.on('getMessage', function(data) {
          if (client.id == code) {
            sync.fiber(function() {
              let message = getMessage(data, tokens);
              console.log(message.payload.parts);
              if (message.payload.parts) {
                console.log(message.payload.parts.length);
                let toBeSent = ''
                message.payload.parts.forEach(function(part) {
                  toBeSent += part.body.data;
                });
                let sub = '';
                message.payload.headers.forEach(function(header) {
                  if (header.name == "Subject") {
                    sub = header.value;
                  }
                });
                client.emit('message', {
                  'body': base64.decode(toBeSent),
                  'subject': sub
                });
              } else {
                console.log(message.payload);
                client.emit('message', {
                  'body': base64.decode(message.payload.body.data),
                  "subject": sub
                });
              }
            });
          }
        });
				client.on('sendSMS', function(data) {
          if (client.id == code) {
            sendMessage(data.mobile,data.subject);
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

var getListOfMessages = function(search, mtoken, cb) {
  token = '?access_token=' + mtoken.access_token;
  let endpoint = '/messages';
  request(apiURL + endpoint + token + '&&q=' + search + '&&maxResults=10',  function (error,  response,  body)  {
    sync.fiber(function() {
      let sendBody = '<ul>';
      // console.log(body);
      JSON.parse(body).messages.forEach(function(listMessage) {
        let message = getMessage(listMessage.id, mtoken);
        sendBody += `<li><a href='#' onclick="openMessage('${message.id}')">${message.snippet}</a></li>`;
        // console.log(message.id);
      });
      sendBody += '</ul>';
      cb(null, sendBody);
    });
  });
}
getListOfMessages = sync(getListOfMessages);

var getMessage = function(messageID, mtoken, cb) {
  token = '?access_token=' + mtoken.access_token;
  let endpoint = '/messages/';
  let url = apiURL + endpoint + messageID + token;
  request(url,  function (error,  response,  body)  {
    cb(null, JSON.parse(body));
  });
}
getMessage = sync(getMessage);

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

 
