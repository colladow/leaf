var leafTemplate = require('../template');
var leafDb = require('../db');
var sys = require('sys');
var emitter = require('events');

var template = '{{ test }} is a variable.';

sys.puts(leafTemplate.render(template, { test: 'Variable' }));

Mongoose.configure({
  activeStoreEnabled: true,
  activeStore: 'dev',
  connections : {
    dev : 'mongodb://localhost/test'
  }
});

Mongoose.load(__dirname + '/models/user.js');

var store = Mongoose.connect('mongodb://localhost/test');

var User = Mongoose.get('User', store);

/*
var user = new User({
  username: 'colladow',
  first: 'Wilson',
  last: 'Collado'
});

user.save();

sys.puts(user.fullName);
*/

var found = User.find({ username: 'colladow' });

found.each(function(doc){
  sys.puts(doc.fullName);
});
