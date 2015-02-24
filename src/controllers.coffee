_ = require 'underscore'

controllers =
    config: (req, res) ->
        omitKeys = req.app.get 'hidden'
        res.jsonp _.omit req.app.settings, omitKeys, 'hidden'

module.exports = controllers
