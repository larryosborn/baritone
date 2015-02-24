var controllers, _;

_ = require('underscore');

controllers = {
  config: function(req, res) {
    var omitKeys;
    omitKeys = req.app.get('hidden');
    return res.jsonp(_.omit(req.app.settings, omitKeys, 'hidden'));
  }
};

module.exports = controllers;
