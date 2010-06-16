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
    this.conn.collection('users', function(err, coll){
    });

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

var model = require('../lib/');

var user = model.model({
  name: 'User',
  collectionName: 'users',
  fields: {
    username: model.field({ 
      type: String, 
      custom: function(value){
        return value.indexOf('c') === 0;
      }
     }),
    first: model.field({ type: String }),
    last: model.field({ type: String, required: true }),
    langs: model.field({ type: Array }),
    address: model.field({ 
      type: Object, 
      custom: function(value){
        if(typeof value.zip !== 'number'){
          return false;
        }

        return true;
      }
    })
  },
  methods: {
    fullName: function(){
      return this.get('first') + ' ' + this.get('last');
    }
  },
  validate: function validate(){
    var target = '',
        last = this.get('last') || '',
        first = this.get('first') || '';

    target = last.toLowerCase();
    target += first.slice(0, 1).toLowerCase();

    return target === this.get('username');
  }
});

var u = user.create({ 
  username: 'colladox',
  first: 'Xilson',
  last: 'Collado',
  langs: ['java', 'perl'],
  address: {
    street: '7711 60th St',
    city: 'Ridgewood',
    state: 'NY',
    zip: 11385
  }
});

sys.puts(u.fullName());

var u2 = user.getById('4c1929557fa277510c000001', function(instance){
  sys.puts(instance.fullName());

  var newLangs = instance.get('langs');
  //newLangs.push('C');
  newLangs.pop();
  instance.set('langs', newLangs);

  instance.save(function(success, obj){
    var u3 = user.getById('4c1929557fa277510c000001', function(instance){
      sys.puts(sys.inspect(instance.get('langs')));
    });
  });
});
/*
u.save(function(success, obj){
  if(success){
    sys.puts('Created => ');
    sys.puts(sys.inspect(obj));
    sys.puts(sys.inspect(u.get('_id')));
  }
});
*/
