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
  proto: {
    findXilsons: function(callback){
      var q = this.find({ first: 'Xilson' }).limit(2);

      q.each(callback);
    }
  },
  validate: function(){
    var target = '',
        last = this.get('last') || '',
        first = this.get('first') || '';

    target = last.toLowerCase();
    target += first.slice(0, 1).toLowerCase();

    return target === this.get('username');
  }
})({
  dbname: 'test',
  host: 'localhost'
});

var q = user.find({ username: 'colladox' }).count(function(err, count){
  console.log(count);
});
/*
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

var count = 1;
user.findXilsons(function(err, doc){
  sys.puts('Xilson ' + count);
  sys.puts(doc.fullName());

  count++;
});


sys.puts(u.fullName());
sys.puts(u.zipCode());

var u2 = user.getById('4c194897fd60f6d00e000001', function(err, instance){
  sys.puts(instance.fullName());

  var newLangs = instance.get('langs');
  instance.set('langs', newLangs);

  instance.save(function(err, obj){
    var u3 = user.getById('4c194897fd60f6d00e000001', function(err, instance){
      sys.puts(sys.inspect(instance.get('langs')));
    });
  });

});

u.save(function(err, obj){
  if(!err){
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

var q = user.find({ username: 'colladox' }).limit(2).fields({ username: 1, last: 1 }).sort({ '_id': -1 });

q.each(function(err, doc){
  sys.puts('DOC---------------');
  sys.puts(sys.inspect(doc.toObject()));
}, function(){
	sys.puts('QUERY DONE! =====');
});
*/

