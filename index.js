var jsforce = require("jsforce");
var path = require("path");
var configpath = path.normalize("./");
var config = require(configpath+"config.js");
var conn = new jsforce.Connection();
var loggedIn = false;

//Sign up for a free Developer Edition at https://developer.salesforce.com/signup

//For username / password flow
var username = process.env.username || config.username || null;
var password = process.env.password || config.password || null;
var production = process.env.production || config.production ||true; //for sandbox and scratch orgs, set to false
var deployToWeb = process.env.deployToWeb || config.deployToWeb ||true; 
/*

Commented code below can be used to set up a web based oauth flow instead
of username and password.  Doing so will require a connected app and a user 
with the correct IP permissions.

Learn more here: 
https://developer.salesforce.com/docs/atlas.en-us.api_rest.meta/api_rest/intro_understanding_authentication.htm

*/

if(deployToWeb) {
    var port = process.env.PORT || 8675;
    var express = require('express');
    var app = express();

    var oauth2 = null;
    var publicKey =  process.env.publicKey || config.publicKey || null;
    var privateKey =  process.env.privateKey || config.privateKey || null;


    if(publicKey && privateKey) {
        var oauth2 = new jsforce.OAuth2({
            // you can change loginUrl to connect to sandbox or prerelease env.
            // loginUrl : 'https://test.salesforce.com',
            clientId : publicKey,
            clientSecret : privateKey,
            redirectUri : '/oauth2/auth'
        });

                //
        // Get authorization url and redirect to it.
        //
        app.get('/oauth2/auth', function(req, res) {
            res.redirect(oauth2.getAuthorizationUrl({ scope : 'api id web' }));
        });
    }

    app.get('/contacts/', function(req, res) {
        conn.query("SELECT Id, Name, CreatedDate FROM Contact", function(err, result) {
            if (err) { return console.error(err); }
            console.log("total : " + result.totalSize);
            res.json(result);
          });
    });

    //setup actual server
    var server = app.listen(port, function () {

        console.log('jsforce sample running on '+port);
    });
}


  



//Log in using username and password, set loggedIn to true and handle a callback
//
function login(callback) {
    if(!production) { conn.loginUrl = 'https://test.salesforce.com'; }
    if(username && password) {
        conn.login(username, password, function(err, res) {
            if (err) { return console.error(err); }
            else { 
                loggedIn = true; 
                console.log("Succcessfully logged into Salesforce.");
                console.log(res);
                if(callback){callback();}
            }
          });
    }
    else {
        console.log("Username and password not setup.")
    }
}

/*

Below are three different styles of querying records that jsforce supports
For more on data modeling in Salesforce: https://trailhead.salesforce.com/en/content/learn/modules/data_modeling

*/

//find contacts using plain SOQL
//More on SOQL here: https://trailhead.salesforce.com/en/content/learn/modules/apex_database
function displayContactsSOQL() {
    conn.query("SELECT Id, Name, CreatedDate FROM Contact", function(err, result) {
        if (err) { return console.error(err); }
        console.log("total : " + result.totalSize);
        for (var i=0; i<result.records.length; i++) {
            var record = result.records[i];
            console.log("Name: " + record.Name);
            console.log("Created Date: " + record.CreatedDate);
        }
      });
}


//find contacts by listening to events
function displayContactsEventMethod() {
    console.log('event');
    
    var records = [];
    var query = conn.query("SELECT Id, Name FROM Contact")
    .on("record", function(record) {
        records.push(record);
        console.log(record);
    })
    .on("end", function() {
        console.log("total fetched : " + query.totalFetched);
    })
    .on("error", function(err) {
        console.error(err);
    })
    .run({ autoFetch : true }); // synonym of Query#execute();
}

//find contacts by constructing the query in a method chain
function displayContactsMethodChain() {
    //
    // Following query is equivalent to this SOQL
    //
    // "SELECT Id, Name, CreatedDate FROM Contact
    //  WHERE LastName LIKE 'A%' 
    //  ORDER BY CreatedDate DESC, Name ASC
    //  LIMIT 5"
    //
    console.log('method');
    conn.sobject("Contact")
        .find({
        FirstName : { $like : 'Demo%' }
        },
        'Id, Name, CreatedDate' // fields can be string of comma-separated field names
                                // or array of field names (e.g. [ 'Id', 'Name', 'CreatedDate' ])
        )
        .sort('-CreatedDate Name') // if "-" is prefixed to field name, considered as descending.
        .limit(5)
        .execute(function(err, records) {
        if (err) { return console.error(err); }
        console.log("record length = " + records.length);
        for (var i=0; i<records.length; i++) {
            var record = records[i];
            console.log("Name: " + record.Name);
            console.log("Created Date: " + record.CreatedDate);
        }
    });
}

function createContact() {
    console.log('create');
    conn.sobject("Contact").create({FirstName: 'APIDemo', LastName: 'User'}, function(err, ret) {
        if (err || !ret.success) { return console.error(err, ret); }
        else {
            console.log("Created record id : " + ret.id);
        }
      });
}

function updateContact() {
    // Single record update.  For multiple records, provide update() with an array
    // Always include record id in fields for update
    // You can also update and insert from the same array.
    conn.query("SELECT Id, Name FROM Contact WHERE FirstName = 'APIDemo'")
    .on("record", function(record) {
        conn.sobject("Contact").update({Id: record.Id, LastName: 'Smith'}, function(err, ret) {
            if (err || !ret.success) { return console.error(err, ret); }
            console.log('Updated Successfully : ' + ret.id);
        });
    });
    
}

function deleteContact() {
    conn.query("SELECT Id, Name FROM Contact WHERE FirstName = 'APIDemo'")
    .on("record", function(record) {
        conn.sobject("Contact").delete(record.Id, function(err, ret) {
            if (err || !ret.success) { return console.error(err, ret); }
            console.log('Deleted Successfully : ' + ret.id);
          });
    });
}


//to test out the above code on the command line:
//node index.js {command}
//
//where command is one of the case statements below
var callback = null;
if (process.argv[2]) { 
    console.log(process.argv[2]);
    switch(process.argv[2]) {
        case 'displayContactsSOQL': 
            console.log('1');
            callback = displayContactsSOQL; 
            break;
        case 'displayContactsEventMethod': 
            console.log('2');
            callback = displayContactsEventMethod; 
            break;
        case 'displayContactsMethodChain': 
            console.log('3');
            callback = displayContactsMethodChain; 
            break;
        case 'createContact': 
            callback = createContact; 
            break;
        case 'updateContact': 
            callback = updateContact; 
            break;
        case 'deleteContact': 
            callback = deleteContact; 
            break;
    }
}
login(callback);
