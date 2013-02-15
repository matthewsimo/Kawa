
//  'getRequestToken': function() {
//    var result = Meteor.http.post(
//      'https://api.dropbox.com/1/oauth/request_token', 
//      { headers: { "Authorization": 'OAuth oauth_version="1.0", oauth_signature_method="PLAINTEXT", oauth_consumer_key="'+ appkey + '", oauth_signature="'+ appsecret +'&"'}},
//      function(error, response) {
//        if(error)
//          console.log(error);
//
//        console.log(response);
//      }
//    );
//    return result;
//  },
//
//  'getAccessToken': function() {
//    var result = Meteor.http.post(
//      'https://api.dropbox.com/1/oauth/access_token', 
//      { headers: { "Authorization": 'OAuth oauth_version="1.0", oauth_signature_method="PLAINTEXT", oauth_consumer_key="'+appkey+'", oauth_token="'+ requestToken + '", oauth_signature="'+ appsecret + '&' + requestTokenSecret + '"'}},
//      function(error, response) {
//        if(error)
//          console.log(error);
//
//        console.log(response);
//      }
//    );
//    return result;
//  },



//Meteor.call('getRequestToken', function(error,result) { console.log(result); });
//Meteor.call('getAccessToken', function(error,result) { console.log(result); });

