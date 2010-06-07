var leafTemplate = require('../template');
var leafDb = require('../db');
var sys = require('sys');

var template = '{{ test }} is a variable.';

sys.puts(leafTemplate.render(template, { test: 'Variable' }));

leafDb.load(__dirname + '/models/user');

var User = leafDb.get('User');

var user = new User({
  username: 'colladow',
  first: 'Wilson',
  last: 'Collado'
});

user.save();

sys.puts(user.fullName);
