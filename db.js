var mongo = require('mongodb/');
var Step = require('step');
var sys = require('sys');

var server = new mongo.Server('localhost', mongo.Connection.DEFAULT_PORT);
var db = new mongo.Db('test', server);

var Conn = function(conn){
  this.conn = conn;
};

Conn.prototype = {
  print: function(){
    sys.puts(this.conn);
    this.conn.close();
  }
};

Step(
  function(){
    db.open(this);
  },
  function(err, conn){
    var c = new Conn(conn);

    return c;
  },
  function(err, cObj){
    cObj.print();
  }
);

var model = require('./model/');

var user = new model.model({
  fields: {
    username: new model.field({ 
      type: 'string', 
      custom: function(value){
        return value.indexOf('c') === 0;
      }
     }),
    first: new model.field({ type: 'string' }),
    last: new model.field({ type: 'string', required: true }),
    langs: new model.field({ type: 'object' }),
    address: new model.field({ 
      type: 'object', 
      custom: function(value){
        if(typeof value.zip !== 'number'){
          return false;
        }

        return true;
      }
    })
  },
  validate: function(instance){
    var target = '',
        last = instance.get('last') || '',
        first = instance.get('first') || '';

    target = last.toLowerCase();
    target += first.slice(0, 1).toLowerCase();

    return target === instance.get('username');
  }
});

sys.puts(user.toString());

var u = user.create({ 
  username: 'colladow',
  first: 'Wilson',
  last: 'Collado',
  langs: ['javascript', 'python'],
  address: {
    street: '7711 60th St',
    city: 'Ridgewood',
    state: 'NY',
    zip: 11385
  }
});

sys.puts(u);

sys.puts(u.validate());
