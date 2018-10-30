


var fs = require("fs");
var path = require("path");
var configpath = path.normalize("./");
var content = fs.readFileSync(configpath + "config.json");
var config = JSON.parse(content);
module.exports = config;