Meteor.startup(function(){
  if(Posts.find().count() === 0) {

    // We have no posts - fetch those suckers
    latestGroup = DboxGroups.find({}, {sort: {_group: -1}}).fetch()[0];
    _.each(latestGroup, function(v, k, l) {
      // Parse out actual dropbox items that are files
      if( (k !== "_group") && (k !== "_id") && (!v.is_dir) )
        Meteor.call('fetchContents', v.path, undefined);
    });

  }
});
