var model = require('./model'),
		db = require('./db');

for(var i in model){
	exports[i] = model[i];
}

for(var i in db){
	exports[i] = db[i];
}
