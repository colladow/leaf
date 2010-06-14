var mongo = require('mongodb/'),
    db = require('./db').helper;

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
  //   fields   -> an object of field names to instances of model.field
  //   validate -> a custom validation function to validate this model 
  //               independently of field validation, can be used
  //               to test things where one field depends on the other
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
  self.create = function(obj){
    var instance = modelInstance({
      fields: fields, 
      values: obj, 
      methods: methods, 
      customValidation: validate
    });

    return instance;
  };

  self.getById = function(id, callback){
    if(typeof id === 'string'){
      id = mongo.ObjectID.createFromHexString(id);
    }else if(id.constructor !== mongo.ObjectID){
      throw {
        name: 'TypeError',
        message: 'Id must be a mongo _id string or ObjectID'
      };
    }

    db.getModelById(collectionName, id, function(err, doc){
      var instance = modelInstance({
        fields: fields,
        values: doc,
        methods: methods,
        customValidation: validate
      });

      callback(instance);
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
        fields[f] = options.fields[f];
      }
    }

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

  if(options.methods){
    for(var m in options.methods){
      if(options.methods.hasOwnProperty(m) && typeof options.methods[m] === 'function'){
        methods[m] = options.methods[m];
      }
    }
  }

  return self;
};

// The model.modelInstance object is an instance of a model defined by model.model.
var modelInstance = function modelInstance(spec){
  var fields = spec.fields,                        // the list of model.field objects
      customValidation = spec.customValidation,
      fieldValues = {},
      methods = spec.methods,
      newFields = [],
      self = {};

  self.get = function(fieldName){
    return fieldValues[fieldName];
  };

  self.set = function(fieldName, value){
    if(!fields[fieldName]){
      newFields.push(fieldName);
    }

    fieldValues[fieldName] = value;
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

  // unpack the methods
  for(var m in methods){
    self[m] = function(){
      return methods[m].apply(self);
    };
  }

  return self;
};
  
exports.field = field;
exports.model = model;
