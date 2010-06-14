var mongo = require('mongodb/');

var server = new mongo.Server('localhost', mongo.Connection.DEFAULT_PORT);
var db = new mongo.Db('test', server);

var helper = function(){
  var self = {};

  self.find = function(collectionName, query, callback){
    db.open(function(err, db){
      db.collection(collectionName, function(err, coll){
        coll.find(query, function(err, cursor){
          callback(err, cursor);

          db.close();
        });
      });
    });
  };

  self.findOne = function(collectionName, query, callback){
    db.open(function(err, db){
      db.collection(collectionName, function(err, coll){
        coll.findOne(query, function(err, doc){
          callback(err, doc);
          
          db.close();
        });
      });
    });
  };

  self.getModelById = function(collectionName, id, callback){
    self.findOne(collectionName, { '_id': id }, callback);
  };

  return self;
};

exports.helper = helper();
