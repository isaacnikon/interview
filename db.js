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

var addThreads = function(threads, email) {
  client.query(`delete from threads where email='${email}';`, function(err, res) {
    if(!err){
      console.log("Successful delete");
    }else {
      console.log(err);
    }
  });
  threads.forEach(function(thread){
    client.query(`insert into threads(email,threadid) values('${email}','${thread.id}')`,function(err,res){
      if(!err){
        console.log("Successful addThreads");
      }else {
        console.log(err);
      }
    });
  });
}
module.exports.addThreads=addThreads;
