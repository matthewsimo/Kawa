// Initialize some session variables we'll be using
Session.set('postId', null);
Session.set('postSlug', null);
Session.set('buttonPresses', null);

Meteor.autosubscribe(function(){
  Meteor.subscribe('posts');
});

Template.main.greeting = function() {
  return "welcome home";
};

Template.main.pressCounter = function() {
  return Session.get('buttonPresses');
};

Handlebars.registerHelper('mdify', function(content) {
  return new Handlebars.SafeString(marked(content));
});

Handlebars.registerHelper('formatDateTime', function(dateTime) {
  return new Handlebars.SafeString(moment(dateTime).format("MMMM Do YYYY, h:mm:ss a"));
});

Handlebars.registerHelper('timeago', function(dateTime) {
  return new Handlebars.SafeString(moment(dateTime).fromNow());
});

Template.main.events({
  'click input#counter' : function () {
    counter = Session.get('buttonPresses');

    if(counter === null)
      counter = 1;
    else
      counter += 1;
    
    Session.set('buttonPresses', counter);
  }
});

Template.posts.postsList = function() {
  return Posts.find({}, {sort: { publishDate: -1 }});
}

Template.posts.events({
  'click a': function() {
    Router.setPost(this._id, this.slug);
  }
});

Meteor.startup(function() {

  console.log(moment().endOf('day').fromNow());

});


// Router

var PostsRouter = Backbone.Router.extend({
  routes: {
    ":post_id": "main"
  },
  main: function (post_id) {
    Session.set("post_id", post_id);
  },
  setPost: function (post_id, post_slug) {
    console.log("setPost triggered: " + post_id + ": " + post_slug );
    this.navigate(post_id, true);
  }
});

Router = new PostsRouter;

Meteor.startup(function () {
  Backbone.history.start({pushState: true});
});

