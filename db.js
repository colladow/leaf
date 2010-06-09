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

var User = new model.Model({
  fields: {
    username: new model.Field({ type: String }),
    first: new model.Field({ type: String }),
    last: new model.Field({ type: String, required: true })
  }
});

sys.puts(User.toString());

var u = User.create({ 
  username: 'colladow',
  first: 'Wilson',
  last: 'Collado'
});

sys.p(u);
