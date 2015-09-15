'use strict';

var config = require('../../config/environment');

// Get domain.
exports.getDomain = function(req, res) {
    return res.send({ domain: config.domain });
};

exports.getFieldTypes = function(req, res) {
    return res.json(config.fields.types);
}

function handleError(res, err) {
  return res.send(500, err);
}
