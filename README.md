# jsforce-sample

This is a simple interactive demonstration of how to use Salesforce with Node.js via a library called jsforce.  jsforce can be run via command line or used with server side solutions like express.

Node is required, obviously: https://nodejs.org/en/

You will also want a Developer Edition org (which are free and do not have a fixed expiration): https://developer.salesforce.com/signup

Then to install and run:

1. Clone or download this repository
2. In the repository directory run **npm install -local**
3. Modify config.json with the username and password for your Developer Edition.
4. Run **node index.js displayContactsSOQL** to see a list of contacts from your instance.

index.js will accept:
* displayContactsSOQL
* displayContactsEventMethod
* displayContactsMethodChain
* createContact
* updateContact
* deleteContact

Comments within index.js point to specifics about the code.  Full documentation for jsforce can be found on the project site: https://jsforce.github.io/

To learn more about developing on the Salesforce Platform, see the Beginner Developer trail on Trailhead: https://trailhead.salesforce.com/content/learn/trails/force_com_dev_beginner




