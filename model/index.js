// The model.field object represents a field in a document.
var field = function(options){
  // special options include:
  //   validation:
  //     required -> is the field required
  //     type     -> what typeof should be returned
  //     custom   -> custom validation function
  var options = options,
      self = {};

  // returns an option
  self.get = function(attribute){
    return options[attribute];
  };

  // valdiates the field
  self.validate = function(value){
    if(self.get('required') && !value){
      return false;
    }

    if(self.get('type') && value && typeof value !== self.get('type')){
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
  var options = options,
      fields = {},
      validate = function(){ return true; },
      self = {};

  // create an instance of this model
  self.create = function(obj){
    var instance = modelInstance(fields, obj, validate);

    return instance;
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
  }

  if(options.validate && typeof options.validate === 'function'){
    validate = options.validate;
  }

  return self;
};

// The model.modelInstance object is an instance of a model defined by model.model.
var modelInstance = function(fields, values, customValidation){
  var fields = fields,                        // the list of model.field objects
      customValidation = customValidation,
      fieldValues = {},
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
    if(errors.length === 0 && !customValidation(self)){
      errors.push('Custom validation failed.');
    };

    return errors;
  };

  // unpack the values
  for(var val in values){
    if(values.hasOwnProperty(val)){
      self.set(val, values[val]);
    }
  }

  return self;
};
  
exports.field = field;
exports.model = model;
