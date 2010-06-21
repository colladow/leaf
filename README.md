# Leaf

  Leaf is a MongoDB ORM for Node!

  Leaf allows you to create models that map to documents in MongoDB. Leaf models can contain arbitrary business logic, and can even handle things like validation to enforce data integrity.

## Requirements

  Leaf is built on top of [christkv's][christkv] [node-mongodb-native][mongodb-native] library (many thanks Christian!). It requires his mongodb module to be on your node path.

## Defining a Model

  Let's dig right in with the obligatory blog example!

    var leaf = require('leaf'),
        sys = require('sys');

    connOptions = {
      dbname: 'mydb',
      host: 'localhost'
      // port is optional, defaults to mongo's default port
    };

    var Blog = leaf.model({
      name: 'Blog',
      collectionName: 'blogs',
      fields: {
        title: {
          type: String,
          custom: function(value){
            return value.length <= 50;
          },
          required: true
        },
        body: {
          type: String,
          required: true
        },
        poster: {
          type: Object,
          required: true,
          custom: function(value){
            if(!value.first || typeof value.first !== 'string'){
              return false;
            }

            if(!value.last || typeof value.last !== 'string'){
              return false;
            }

            return true;
          }
        },
        comments: {
          type: Array
        }
      },
      methods: {
        posterFullName: function(){
          var poster = this.get('poster');

          return poster.first + ' ' + poster.last;
        }
      }
    })(connOptions);  // you can provide different connection options for every model you define

  This example shows most of what you can do with a Leaf model. Here's a breakdown of the options:

    - name: The model's name...duh...
    - collectionName: The name of the mongo collection to use. Defaults to name.toLowerCase()
    - fields: An object describing the fields in your model. The keys are the field names. Options:
      + type: The constructor of the field. On validation, it will check value.constructor === type.
      + required: Is this field required? Defaults to false.
      + custom: A function where you can supply custom validation. Your function will be passed the target value.
    - methods: An object that contains instance level functions that will be added to all instances of your model. You can look at the source for modelInstance to get a better feel for how this works.

## Model Instances

  Now that we've defined a model, we can start using it and appreciating the work it's doing for us.

    var firstPost = Blog.create({
      title: 'Hello, world!',
      body: 'This is my first ever blog post using Leaf!',
      poster: {
        first: 'Wilson',
        last: 'Collado'
      }
    });

  There. We now have an instance of our model. You can see where methods comes into play now:

    sys.puts(firstPost.posterFullName());  // prints 'Wilson Collado'

  But this hasn't been saved to the database yet, so we might lose this awesome first post! Let's save it now:

    firstPost.save(function(err, obj){
      if(err){
        sys.puts('Oh snaps! Something went wrong!');
        return;
      }

      sys.puts('Success!');
      sys.puts('Your instance has been granted an ObjectID! ' + firstPost.get('_id'));
    });

## Fetching Dataz

  Now that we have some data saved, let's start fetching some of it.

    var someId = MAGIC(); // the MAGIC function here pulls a mongo ObjectId out of thin air, and it happens to represent a blog post!
                          // if the id is a string, it gets converted to a mongo ObjectId
                          // Disclaimer: MAGIC does not actually exist...

    Blog.getById(someId, function(err, instance){
      if(err){
        sys.puts('Booooo! I hate errors!');
        return;
      }

      sys.puts(instance.get('title'));    // this post is titled: 'I <3 Nested Callbacks'

      // let's change the title...
      instance.set('title', 'I <3 JavaScriptz');

      // now let's save that change
      instance.save(function(err, obj){
        if(err){
          sys.puts('Pfft! As if this would ever happen...');
          return;
        }

        sys.puts(instance.get('title')); // prints 'I <3 JavaScriptz'
      });
    });

  We don't always have ids for our objects. Let's write some queries:

    var query = Blog.find({ 'poster.first': 'Wilson' });   // this returns a queryResult object

    // we can chain query filters

    query = query.limit(5).fields({ title: 1 });    // only get the titles for 5 of them

    // queryResults defer the query until you actually access the results
    query.each(function(err, post){
      sys.puts(post.get('title'));
    });

[christkv]: http://github.com/christkv
[mongodb-native]: http://github.com/christkv/node-mongodb-native
