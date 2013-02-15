// Posts -- { title: String,
//            slug: String,
//            content: String,
//            tags: [String, ...],
//            publishDate: Number,
//            editDate: Number
//         }  
Posts = new Meteor.Collection("posts");

// Our Dbox files
DboxGroups = new Meteor.Collection("dbox");

Meteor.startup(function(){


});
