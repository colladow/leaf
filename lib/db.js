var mongo = require('mongodb/');

var server = new mongo.Server('localhost', mongo.Connection.DEFAULT_PORT);
var db = new mongo.Db('test', server);

var fillModel = function(id, callback){
  db.open(function(err, db){
    db.collection('users', function(err, coll){
      coll.findOne({ '_id': id }, function(err, doc){
        callback(err, doc);
        db.close();
      });
    });
  });
};

exports.fillModel = fillModel;
