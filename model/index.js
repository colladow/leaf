var Field = function(options){
  this.options = options;
};

Field.prototype = {
  get: function(attribute){
    return this.options[attribute];
  },

  validate: function(value){
    if(!value) return false;

    if(this.get('required')){
      if(value != null && value != undefined){
        if(this.get('type') == String && value == '') return false;
      }else{
        return false;
      }
    }

    return true;
  }
};

var Model = function(options){
  this.options = options;
  this.fields = {};

  this.unpackFields();
};

Model.prototype = {
  create: function(obj){
    var fields = {};
    var errors = [];

    for(var f in this.fields){
      if(this.fields[f].validate(obj[f])){
        fields[f] = obj[f];
      }else{
        errors.push(f + ' failed to validate.');
      }
    }

    if(errors.length > 0){
      return errors;
    }else{
      return fields;
    }
  },

  toString: function(){
    var str = '';
    for(var f in this.fields){
      str += f + ' => ' + this.fields[f] + '\n';
    }

    return str;
  },

  unpackFields: function(){
    if(!this.options.fields) return;

    for(var f in this.options.fields){
      this.fields[f] = this.options.fields[f];
    }
  }
};

exports.Field = Field;
exports.Model = Model;
