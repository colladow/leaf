var mongo = require('mongodb'),
    db = null,
    helper = require('./db').helper;

// The model.field object represents a field in a document.
var field = function(options){
  // special options include:
  //   validation:
  //     required -> is the field required
  //     type     -> what typeof should be returned
  //     custom   -> custom validation function
  var self = {};

  // returns an option
  self.get = function(attribute){
    return options[attribute];
  };

  // valdiates the field
  self.validate = function validate(value){
    if(self.get('required') && !value){
      return false;
    }

    if(self.get('type') && value && value.constructor !== self.get('type')){
      return false;
    }

    if(self.get('custom') && !self.get('custom')(value)){
      return false;
    }

    return true;
  };

  return self;
};

// The model.model object represents a document in the database.
var model = function(options){
  // special options include
  //   fields         -> an object of field names to instances of model.field
  //   methods        -> an object of instance methods to attach to the modelInstance
  //   proto        -> an object of methods to attach to the model object
  //   name           -> the name of this model
  //   collectionName -> the name of the collection in the db.
  //                     if not provided, defaults to the name in lower case
  //   validate       -> a custom validation function to validate this model 
  //                     independently of field validation, can be used
  //                     to test things where one field depends on the other
  var fields = {},
      methods = {},
      name = options.name || '',
      collectionName = options.collectionName || name.toLowerCase(),
      validate = function(){ return true; },
      self = {};

  if(!name){
    throw new Error('Models require a name.');
  }

  // create an instance of this model
  self.create = function(obj, isNew){
    isNew = (typeof isNew === 'undefined') ? true : isNew;

    var instance = modelInstance({
      collection: collectionName,
      fields: fields, 
      values: obj, 
      methods: methods, 
      customValidation: validate,
      newFlag: isNew
    });

    return instance;
  };

  // fetch a queryResult object
  self.find = function(query){
    return queryResult(self, collectionName, query);
  };

  // get a queryResult object to fetch all documents
  self.all = function(callback){
    var query = self.find({});

    if(callback){
      query.each(callback);
    }else{
      return query;
    }
  };

  // query the database for the data associated with this model
  // based on an ObjectID. strings are converted to ObjectID.
  self.getById = function(id, callback){
    if(typeof id === 'string'){
      id = mongo.ObjectID.createFromHexString(id);
    }else if(id.constructor !== mongo.ObjectID){
      throw {
        name: 'TypeError',
        message: 'Id must be a mongo _id string or ObjectID'
      };
    }

    db.getModelById(collectionName, id, function(handle, err, doc){
      // get the data and create a new modelInstance
      callback(err, self.create(doc, false));

      handle.close();
    });
  };

  self.toString = function(){
    var str = '';
    for(var f in fields){
      str += f + ' => ' + fields[f] + '\n';
    }

    return str;
  };

  // unpack the fields
  if(options.fields){
    for(var f in options.fields){
      if(options.fields.hasOwnProperty(f)){
        fields[f] = field(options.fields[f]);
      }
    }

    // if an _id is not provided, create a new one
    if(!fields['_id']){
      fields['_id'] = field({
        type: mongo.ObjectID,
        required: true
      });
    }
  }

  if(options.validate && typeof options.validate === 'function'){
    validate = options.validate;
  }

  // unpack the modelInstance methods
  if(options.methods){
    for(var m in options.methods){
      if(options.methods.hasOwnProperty(m) && typeof options.methods[m] === 'function'){
        methods[m] = options.methods[m];
      }
    }
  }

  // unpack the static methods
  if(options.proto){
    for(var s in options.proto){
      if(options.proto.hasOwnProperty(s) && typeof options.proto[s] === 'function'){
        self[s] = options.proto[s];
      }
    }
  }

  return function(options){
    db = helper(options);

    return self;
  };
};

// The model.modelInstance object is an instance of a model defined by model.model.
var modelInstance = function(spec){
  var fields = spec.fields,                        // the list of model.field objects
      collection = spec.collection,
      customValidation = spec.customValidation,
      fieldValues = {},
      methods = spec.methods,
      dirtyFields = [],
      newFlag = spec.newFlag,
      self = {};

  self.get = function(fieldName){
    return fieldValues[fieldName];
  };

  self.isBound = function(){
    return !newFlag;
  };

  self.remove = function(callback){
    if(!newFlag){
      db.remove(collection, { '_id': self.get('_id') }, function(handle, err, result){
        callback(err);

        handle.close();
      });
    }else{
      callback(null);
    }
  };

  // update or insert this model
  self.save = function(callback){
    var err = self.validate(),
        doc = {},
        affectedFields = null;

    // make sure the data validates
    if(err.length){
      callback(err, null);
      return;
    }

    if(newFlag){
      // if this is a new model object...

      // grab the field values
      for(var f in fields){
        if(fields.hasOwnProperty(f)){
          doc[f] = self.get(f);
        }
      }

      // insert the data into the database
      db.insert(collection, doc, function(handle, err, obj){
        if(err){
          callback(err, null);
          return;
        }

        // update the ObjectId for this instance
        if(obj['_id']){
          self.set('_id', obj['_id']);
        }

        // clear the dirty fields and the newFlag (it's not new anymore)
        dirtyFields = [];
        newFlag = false;

        // forward the object
        callback(null, obj);
      
        handle.close();
      });
    }else{
      // if this is instance is already in the db...

      // grab the fields that have changed
      dirtyFields.forEach(function(f){
        if(fields.hasOwnProperty(f)){
          doc[f] = self.get(f);
        }
      });

      // update the data in the db
      db.findAndModify(collection, { '_id': self.get('_id') }, { '$set': doc }, function(handle, err, obj){
        if(err){
          callback(err, null);
          return;
        }

        dirtyFields = [];   // clear the dirty fields
        callback(null, obj);

        handle.close();
      });
    }
  };

  self.set = function(fieldName, value){
    dirtyFields.push(fieldName);

    fieldValues[fieldName] = value;
  };

  self.toObject = function(){
    var obj = {};

    for(var f in fieldValues){
      if(fieldValues.hasOwnProperty(f)){
        obj[f] = fieldValues[f];
      }
    }

    return obj;
  };

  self.toString = function(){
    var str = '';

    for(var f in fields){
      str += f + ' => ' + self.get(f) + '\n';
    }

    return str;
  };

  // check this instance for errors
  self.validate = function(){
    var errors = [];

    for(var f in fields){
      if(!fields[f].validate(self.get(f))){
        errors.push(f + ' failed to validate.');
      }
    }

    // don't run the custom validation if the fields aren't all clean
    if(errors.length === 0 && customValidation && !customValidation.apply(self)){
      errors.push('Custom validation failed.');
    };

    return errors;
  };

  // unpack the values
  for(var val in spec.values){
    if(spec.values.hasOwnProperty(val)){
      self.set(val, spec.values[val]);
    }
  }

  // set an objectid if it's not given
  if(spec.values && !spec.values['_id']){
    self.set('_id', new mongo.ObjectID(null));
  }
  dirtyFields = [];   // clear the dirty fields

  // unpack the methods
  for(var m in methods){
    if(methods.hasOwnProperty(m)){
      self[m] = methods[m];
    }
  }

  return self;
};

var queryResult = function(model, collection, query){
  var options = {},
      self = {};

  options['explain'] = null,
  options['fields'] = {},
  options['hint'] = null,
  options['limit'] = 0,
  options['skip'] = 0,
  options['snapshot'] = false,
  options['sort'] = [],
  options['timeout'] = 0,

  query = query || {};

  // actually run the query, returning a modelInstance for every document
  self.each = function(callback, doneCallback){
    // the driver will only check if this option exists, not its value
    if(!options['snapshot']){
      delete options['snapshot'];
    }

    db.find(collection, query, options, function(handle, err, cursor){
      if(err){
        callback(err, null);
        return;
      }

      cursor.each(function(err, doc){
        if(doc){
          callback(err, model.create(doc, false));
        }else{
          handle.close();

          if(doneCallback) doneCallback();
        }
      });
    });
  };

  self.count = function(callback){
    // the driver will only check if this option exists, not its value
    if(!options['snapshot']){
      delete options['snapshot'];
    }
    
    db.count(collection, query, options, function(handle, err, count){
      handle.close();
      
      if(err){
        callback(err, null);
        return;
      }
      
      callback(null, count);
    });
  };

  // ===============================================================
  //      chainable methods to modify the options
  // ===============================================================
  self.explain = function(){
    options['explain'] = true;

    return self;
  };

  self.fields = function(obj){
    options['fields'] = obj;

    return self;
  };

  self.hint = function(obj){
    options['hint'] = obj;

    return self;
  };

  self.limit = function(num){
    options['limit'] = num;

    return self;
  };

  self.skip = function(num){
    options['skip'] = num;

    return self;
  };

  self.snapshot = function(){
    options['snapshot'] = true;

    return self;
  };

  // the driver expects sort to look like this:
  //     [ ['field1', (1|-1)], ['field2', (1|-1)] ]
  // but you can just pass an object to this method:
  //     { 'field1': (1|-1) }
  // the array version is much better for multiple key sorts, since order matters, 
  // but the object version is quite convenient and easy to read
  self.sort = function(obj){
    var sort = obj;
    if(obj.constructor !== Array && typeof obj === 'object'){
      sort = [];
      for(var f in obj){
        if(obj.hasOwnProperty(f)){
          sort.push([f, obj[f]]);
        }
      }
    }

    options['sort'] = sort;

    return self;
  };

  self.timeout = function(num){
    options['timeout'] = num;

    return self;
  };

  return self;
};

exports.model = model;
