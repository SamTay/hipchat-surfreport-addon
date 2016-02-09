var http = require('request');
var cheerio = require('cheerio');

var surflineUrl = "http://www.surfline.com/surf-report/the-washout-southeast_5293/";
module.exports.getSummaryJson = function(callback) {
  http(surflineUrl, function(err, res, body) {
    if (err || res.statusCode != 200) {
      callback(err ? err : 'Failed connection to Surfline.');
    }
    var $ = cheerio.load(body);
    var surfHeight = $('#observed-wave-range').text();
    var conditionText = $('#observed-spot-conditions').text().toUpperCase().replace(' CONDITIONS', '');
    var conditionClass = (function(conditionMap) {
      return conditionMap[Object.keys(conditionMap).reduce(function(prev, curr) {
        return (conditionText.indexOf(curr) > -1) ? curr : prev
      })];
    })({FLAT: "default", POOR: "default", FAIR: "default", GOOD: "success", EPIC: "error"});
    callback(null, {surfHeight: surfHeight, conditionText: conditionText, conditionClass:conditionClass});
  });
};
