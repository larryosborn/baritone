const _ = require('lodash');

exports.config = (req, res) => {
    const omitKeys = req.app.get('hidden');
    res.jsonp(_.omit(req.app.settings, omitKeys, 'hidden'));
};
