Object.identical = function (a, b, sortArrays) {
        
    function sort(object) {
        if (sortArrays === true && Array.isArray(object)) {
            return object.sort();
        }
        else if (typeof object !== "object" || object === null) {
            return object;
        }

        return Object.keys(object).sort().map(function(key) {
            return {
                key: key,
                value: sort(object[key])
            };
        });
    }
    
    return JSON.stringify(sort(a)) === JSON.stringify(sort(b));
};

Meteor.publish('posts', function () {
  return Posts.find();
});

Meteor.publish('dbox', function(){
  return DboxGroups.find();
});


var appkey = '9fij6hc7lspy8yl';
var appsecret = 'iw6ghnu3k4bbky7';

var requestToken = 'g31xkn4lky13sfx';
var requestTokenSecret = 'vsygntawfqiza5s';

var accessToken = 'lpvqwbncj1allu6';
var accessTokenSecret = 'ibc7fxln5qwwwlx';

Meteor.methods({

  pingDropbox: function() {
    console.log("pinging Dropbox\n");
    this.unblock();
    var result = Meteor.http.get(
      'https://api.dropbox.com/1/metadata/sandbox/',
      { headers: { "Authorization": 'OAuth oauth_version="1.0", oauth_signature_method="PLAINTEXT", oauth_consumer_key="'+ appkey +'", oauth_token="'+ accessToken + ', oauth_signature="'+ appsecret + '&' + accessTokenSecret + '"'}},
      function(err, res) {
        if(err) {
          console.log("err: ");
          console.log(err);
        } else if (res.statusCode === 200) {

          // Initialize
          var fetchedDBox, currentDBox, DBoxGroup = undefined;


          // Get latest set of data for DBox Collection, descending order on _group
          currentDBox = DboxGroups.find({}, {sort: {_group: -1}}).fetch()[0];

          if( currentDBox === undefined ) {// If there isn't a currentDBox, then it's the first ever, in that case, intialize our index var
            DBoxGroup = -1;
          } else {
            // Save out some data for it cause we'll remove it for comparison but use it later
            DBoxGroup = currentDBox._group;
            delete currentDBox._group;
            delete currentDBox._id;
          }
          // Convert the response data into an object for proper comparison
          fetchedDBox = _.extend({}, res.data.contents);

          if(Object.identical(currentDBox, fetchedDBox)) {
            // They match, move along
          } else {
            // They don't match, 

            // let's ship two groups for parsing/matching 
            Meteor.call("parseGroup", _.values(fetchedDBox), _.values(currentDBox));

            // & add the new group to DboxGroups!
            fetchedDBox._group = DBoxGroup + 1;
            DboxGroups.insert(fetchedDBox);

          }

        }
      }
    );
  },

  parseGroup: function(fetchedValues, previousValues) {

    this.unblock();



    // We need to find the differences in the values of this group vs. the last group then run commands on what we find
    //
    // if there is an extra file, run Posts.Insert
    // if there is a missing file, run Posts.remove
    // if a file has a new rev, run Posts.update



      console.log("fetchedValues count: " + _.size(fetchedValues) + " - previousValues count: " + _.size(previousValues));
      // Set up test var if we have a missing file
      var somethingMissing = undefined;

      // Test each of the new group for new or updated files
      _.each(fetchedValues, function(v, k) {

        // Set up match var and look for a matching path in the previous group
        var match = undefined;
        match = _.find(previousValues, function(item) {
          return item.path === v.path;
        });
        
        // Test our match
        if(match) {

          // Test for updated rev
          if(match.rev !== v.rev) {
            console.log( "We found a matched path (" + v.path + ") with updated rev, " + match.rev + " => " + v.rev );
            Meteor.call("fetchContents", v.path);
            somethingMissing = 1;
          }
        } else {
          // We didn't find the curret group's file in the previous group, it's new
          console.log( "We have a new file at " + v.path );
          Meteor.call("fetchContents", v.path, undefined);
          somethingMissing = 1;
        }

      });

      if(somethingMissing === undefined) {

        pList = _.pluck(previousValues, 'path');
        cList = _.pluck(fetchedValues, 'path');

        var missingList = [];
        missingList = _.reject(pList, function(num){
          return _.contains(cList, num);
        });

        _.each(missingList, function(v, k){
          Meteor.call("removePost", Meteor.call("getPostSlug", v)); 
        });

      }
      
//
//  Diff lists
//    if same, exit
//    if different,
//      Run through each item of current list, 
//        if find match in prev list based on path, diff same item in prev list's rev property
//          if same, do nothing & continue run through
//          if different, call to fetch for this post & update 
//        if no match, new file, call to fetch for this post & insert
//      Run through each item of previous list,
//        if find match in current list based on path, move on
//        if no match, missing file, call to remove post
//

  },

  fetchContents: function(path, isNew) {

    this.unblock();

    if(isNew === undefined)
      isNew = true;
    else
      isNew = false;

    var result = Meteor.http.get(
      'https://api-content.dropbox.com/1/files/sandbox' + path,
      { headers: { "Authorization": 'OAuth oauth_version="1.0", oauth_signature_method="PLAINTEXT", oauth_consumer_key="'+ appkey +'", oauth_token="'+ accessToken + ', oauth_signature="'+ appsecret + '&' + accessTokenSecret + '"'}},
      function(err, res) {
        if(err) {
          console.log("err: ");
          console.log(err);
        } else if (res.statusCode === 200) {

          // init vars
          var title, slug, itemData;

          // Convert the string of metadata dropbox sends us into a usable object
          itemData = _.find(res.headers, function(v, k){
            return k === 'x-dropbox-metadata';
          });
          itemData = JSON.parse(itemData);

          title = Meteor.call('getPostTitle', itemData.path);
          slug = Meteor.call('getPostSlug', itemData.path);

          // It's new, insert new record
          if(isNew) {
            Posts.insert({ title: title, slug: slug, content: res.content, publishDate: new Date(itemData.modified).getTime() });
          } else { // It's not new, update the correct record
            Posts.update({ slug: slug }, { $set: { content: res.content, editDate: new Date(itemData.modified).getTime() } });
          }
        }
      }
    );
  },

  removePost: function (slug) {

    Posts.remove({slug: slug});

  },

  getPostSlug: function (path) {

    // remove the file type
    path = path.split('.md').join('').toLowerCase();
    // replace white space or underscores with dash
    path = path.replace(/[\s_]/g, '-');
    // replace anything that isn't a dash or alphanumeric with nothing, aka remove them
    path = path.replace(/[^-a-zA-Z0-9]/g, '');
    return path;

  },


  getPostTitle: function(path) {

    // remove the path base slash & file type, theN return
    return path.split('/').join('').split('.md').join('');

  },
  

});


// Call pingDropbox every min
Meteor.startup(function() {

  Meteor.setInterval(function() { Meteor.call('pingDropbox')}, 20 * 1000);

});
