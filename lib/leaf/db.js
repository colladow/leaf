var mongo = require('mongodb'),
    sys = require('sys');

// DB connection and query helper methods
//   the intention is to help "flatten" out the mongodb native api
var helper = function(options){
  var self = {};

  // open a connection to the db
  self.open = function(callback){
    sys.puts(sys.inspect(options));
    var server = new mongo.Server(options.host, options.port || mongo.Connection.DEFAULT_PORT),
        db = new mongo.Db(options.dbname, server);

    db.open(function(err, connection){
      callback(db, err, connection);
    });
  };

  // grab a collection handler from the db
  self.collection = function(collectionName, callback){
    self.open(function(db, err, connection){
      connection.collection(collectionName, function(err, coll){
        callback(db, err, coll);
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
    self.collection(collectionName, function(db, err, coll){
      coll.insert(docs, function(err, objects){
        callback(db, err, objects);
      });
    });
  };

  // run a find query and pass the cursor along
  self.find = function(collectionName, query, options, callback){
    self.collection(collectionName, function(db, err, coll){
      coll.find(query, options, function(err, cursor){
        callback(db, err, cursor);
      });
    });
  };

  // runs a findAndModify to update single instances
  // very useful for _id based updates
  self.findAndModify = function(collectionName, query, doc, callback){
    self.collection(collectionName, function(db, err, coll){
      coll.findAndModify(query, [], doc, function(err, obj){
        callback(db, err, obj);
      });
    });
  };

  // run a findOne query and pass the document along
  self.findOne = function(collectionName, query, callback){
    self.collection(collectionName, function(db, err, coll){
      coll.findOne(query, function(err, doc){
        callback(db, err, doc);
      });
    });
  };

  // run a remove query
  self.remove = function(collectionName, query, callback){
    self.collection(collectionName, function(db, err, coll){
      coll.remove(query, function(err){
        callback(db, err);
      });
    });
  };

  return self;
};

exports.helper = helper;
