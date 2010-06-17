var mongo = require('mongodb'),
		sys = require('sys'),
		leaf = require('../lib/leaf');

var user = leaf.model({
  name: 'User',
  collectionName: 'users',
  fields: {
    username: { 
      type: String, 
      custom: function(value){
        return value.indexOf('c') === 0;
      }
     },
    first: { type: String },
    last: { type: String, required: true },
    langs: { type: Array },
    address: { 
      type: Object, 
      custom: function(value){
        if(typeof value.zip !== 'number'){
          return false;
        }

        return true;
      }
    }
  },
  methods: {
    fullName: function(){
      return this.get('first') + ' ' + this.get('last');
    },
		zipCode: function(){
			return this.get('address').zip;
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
})({
	dbname: 'test',
	host: 'localhost',
	port: mongo.Connection.DEFAULT_PORT
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
sys.puts(u.zipCode());

var u2 = user.getById('4c194897fd60f6d00e000001', function(instance){
  sys.puts(instance.fullName());

  var newLangs = instance.get('langs');
  instance.set('langs', newLangs);

  instance.save(function(success, obj){
    var u3 = user.getById('4c194897fd60f6d00e000001', function(instance){
      sys.puts(sys.inspect(instance.get('langs')));
    });
  });

});

u.save(function(success, obj){
  if(success){
    sys.puts('Created => ');
    sys.puts(sys.inspect(obj));
    sys.puts(sys.inspect(u.get('_id')));
  }

  u.remove(function(err){
    if(!err){
      sys.puts('Removed!');
    }
  });
});

var q = user.find({ username: 'colladox' }).limit(2).fields({ username: 1, last: 1 });

q.each(function(err, doc){
	sys.puts('DOC---------------');
	sys.puts(sys.inspect(doc.toObject()));
});

