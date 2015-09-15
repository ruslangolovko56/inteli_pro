'use strict';

var _ = require('lodash');
var Market = require('./market.model');
var async = require('async');
var Quiz = require('../quiz/quiz.model');

// Get list of markets
exports.index = function (req, res) {
  var userId = req.user._id;

  Market.find({user: userId}, function (err, markets) {
    if (err) {
      return handleError(res, err);
    }
    async.map(markets, function (market, callback) {
      prepareSubmit(market, function (err, market) {
        if (err) {
          return callback(err);
        }
        return callback(null, market);
      });
    }, function (err, markets) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, markets);
    });
  });
};

// Get a single market
exports.show = function (req, res) {
  Market.findById(req.params.id, function (err, market) {
    if (err) {
      return handleError(res, err);
    }
    if (!market) {
      return res.send(404);
    }
    return res.json(market);
  });
};

// Creates a new market in the DB.
exports.create = function (req, res) {
  req.body.user = req.user._id;
  Market.create(req.body, function (err, market) {
    if (err) {
      return handleError(res, err);
    }
    prepareSubmit(market, function(err, market) {
      if(err) {
        return handleError(res,err);
      }
      return res.json(201, market);
    });
  });
};

// Updates an existing market in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  console.log('adsfasdf');
  console.log(req.params);
  Market.findById(req.params.id, function (err, market) {
    if (err) {
      return handleError(res, err);
    }
    if (!market) {
      return res.send(404);
    }
    var updated = _.merge(market, req.body);
    updated.save(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, market);
    });
  });
};

// Deletes a market from the DB.
exports.destroy = function (req, res) {
  Market.findById(req.params.id, function (err, market) {
    if (err) {
      return handleError(res, err);
    }
    if (!market) {
      return res.send(404);
    }
    market.remove(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}

function prepareSubmit(market, callback) {
  Quiz.count({market: market._id}, function (err, count) {
    if (err) {
      return callback(err);
    }
    if (count > 0) {
      market.set('editable', false, {strict: false});
    } else {
      market.set('editable', true, {strict: false});
    }
    return callback(null, market);
  });
}

