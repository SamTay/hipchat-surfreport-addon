var http = require('request');
var cors = require('cors');
var uuid = require('uuid');
var surfline = require('../lib/surfline');

// This is the heart of your HipChat Connect add-on. For more information,
// take a look at https://developer.atlassian.com/hipchat/guide
module.exports = function (app, addon) {
  var hipchat = require('../lib/hipchat')(addon);

  // simple healthcheck
  app.get('/healthcheck', function (req, res) {
    res.send('OK');
  });

  // Root route. This route will serve the `addon.json` unless a homepage URL is
  // specified in `addon.json`.
  app.get('/',
    function(req, res) {
      // Use content-type negotiation to choose the best way to respond
      res.format({
        // If the request content-type is text-html, it will decide which to serve up
        'text/html': function () {
          res.redirect(addon.descriptor.links.homepage);
        },
        // This logic is here to make sure that the `addon.json` is always
        // served up when requested by the host
        'application/json': function () {
          res.redirect('/atlassian-connect.json');
        }
      });
    }
  );

  // This is an example glance that shows in the sidebar
  // https://developer.atlassian.com/hipchat/guide/hipchat-ui-extensions/glances
  app.get('/glance',
    cors(),
    addon.authenticate(),
    function(req, res) {
      surfline.getSummaryJson(function(err, json) {
        if (err) {
          res.json({
            "label": {
              "type": "html",
              "value": "No connection"
            },
            "status": {
              "type": "lozenge",
              "value": {
                "label": "Broken",
                "type": "error"
              }
            }
          });
        } else {
          console.log(json);
          res.json({
            "label": {
              "type": "html",
              "value": json.surfHeight
            },
            "status": {
              "type": "lozenge",
              "value": {
                "label": json.conditionText,
                "type": json.conditionClass
              }
            }
          });
        }
      });
    }
  );

  // This is an example sidebar controller that can be launched when clicking on the glance.
  // https://developer.atlassian.com/hipchat/guide/hipchat-ui-extensions/views/sidebar
  app.get('/sidebar',
    addon.authenticate(),
    function(req, res) {
      res.render('sidebar', {}); }
  );

  // Notify the room that the add-on was installed. To learn more about
  // Connect's install flow, check out:
  // https://developer.atlassian.com/hipchat/guide/installation-flow
  addon.on('installed', function(clientKey, clientInfo, req){
    hipchat.sendMessage(clientInfo, req.body.roomId, 'The ' + addon.descriptor.name + ' add-on has been installed in this room');
  });

  // Clean up clients when uninstalled
  addon.on('uninstalled', function(id){
    addon.settings.client.keys(id+':*', function(err, rep){
      rep.forEach(function(k){
        addon.logger.info('Removing key:', k);
        addon.settings.client.del(k);
      });
    });
  });

};
