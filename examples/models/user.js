var leafDb = require('../../db');

Model.define('User', {
  types: {
    username: String,
    first: String,
    last: String
  },

  getters: {
    fullName: function(){
      return this.first + ' ' + this.last;
    }
  }
});
