var mongo = require('mongodb/');

// DB connection and query helper methods
//   the intention is to help "flatten" out the mongodb native api
var helper = function(){
  var self = {};

  // open a connection to the db
  self.open = function(callback){
    var server = new mongo.Server('localhost', mongo.Connection.DEFAULT_PORT),
        db = new mongo.Db('test', server);

    db.open(function(err, connection){
      callback(err, connection);

      db.close();
    });
  };

  // grab a collection handler from the db
  self.collection = function(collectionName, callback){
    self.open(function(err, connection){
      connection.collection(collectionName, function(err, coll){
        callback(err, coll);
      });
    });
  };

  // run a findOne querying on an ObjectId
  self.getModelById = function(collectionName, id, callback){
    self.findOne(collectionName, { '_id': id }, callback);
  };

  // insert documents into the database
  //  docs can be one document or an array of documents
  self.insert = function(collectionName, docs, callback){
    self.collection(collectionName, function(err, coll){
      coll.insert(docs, function(err, objects){
        callback(err, objects);
      });
    });
  };

  // run a find query and pass the cursor along
  self.find = function(collectionName, query, callback){
    self.collection(collectionName, function(err, coll){
      coll.find(query, function(err, cursor){
        callback(err, cursor);
      });
    });
  };

  // runs a findAndModify to update single instances
  // very useful for _id based updates
  self.findAndModify = function(collectionName, query, doc, callback){
    self.collection(collectionName, function(err, coll){
      coll.findAndModify(query, [], doc, function(err, obj){
        callback(err, obj);
      });
    });
  };

  // run a findOne query and pass the document along
  self.findOne = function(collectionName, query, callback){
    self.collection(collectionName, function(err, coll){
      coll.findOne(query, function(err, doc){
        callback(err, doc);
      });
    });
  };

  // run a remove query
  self.remove = function(collectionName, query, callback){
    self.collection(collectionName, function(err, coll){
      coll.remove(query, function(err){
        callback(err);
      });
    });
  };

  return self;
};

exports.helper = helper();
