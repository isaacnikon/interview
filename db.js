const pg = require('pg');
var cred = require('./client_secret.json').db;

const client = new pg.Client({
  user: cred.user,
  host: 'localhost',
  database: 'interview',
  password: cred.password,
  port: 5432,
});
client.connect();
client.query('select * from test;', function(err,res){
  if (!err) {
    console.log(res.rows);
    client.end();
  }else {
    console.log(err);
    client.end();
  }

});
