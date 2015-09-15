'use strict';

var _ = require('lodash');
var Resultspage = require('./resultspage.model');
var Result = require('../result/result.model');
var Quiz = require('../quiz/quiz.model');
var async = require('async');
var utils = require('../../components/utils/utils');

// Get list of resultspages
exports.index = function (req, res) {
  var userId = req.user._id;

  Resultspage.find({user: userId}).populate('results').exec(function (err, resultspages) {
    if (err) {
      return handleError(res, err);
    }
    async.map(resultspages, function (resultspage, callback) {
      prepareSubmit(resultspage, function (err, resultspage) {
        if (err) {
          return callback(err);
        }
        return callback(null, resultspage);
      });
    }, function (err, resultspages) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, resultspages);
    });
  });
};

// Get a single resultspage
exports.show = function (req, res) {
  Resultspage.findById(req.params.id).populate('results').exec(function (err, resultspage) {
    if (err) {
      return handleError(res, err);
    }
    if (!resultspage) {
      return res.send(404);
    }

    return res.json(resultspage);
  });
};

// Creates a new resultspage in the DB.
exports.create = function (req, res) {
  Resultspage.create(req.body, function (err, resultspage) {
    if (err) {
      return handleError(res, err);
    }

    Result.populate(resultspage, {path: 'results'}, function(err, resultspage) {
      if(err) {
        return handleError(res, err);
      }

      prepareSubmit(resultspage, function (err, resultspage) {
        if (err) {
          return handleError(res, err);
        }
        console.log(resultspage);
        return res.json(201, resultspage);
      });
    });
  });
};

// Updates an existing resultspage in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Resultspage.findById(req.params.id, function (err, resultspage) {
    if (err) {
      return handleError(res, err);
    }
    if (!resultspage) {
      return res.send(404);
    }
    var updated = _.merge(resultspage, req.body, function (a, b) {
      return _.isArray(a) ? b : undefined;
    });
    updated.save(function (err) {
      if (err) {
        return handleError(res, err);
      }

      Result.populate(updated, {path: 'results'}, function(err, updated) {
        if(err) {
          return handleError(res, err);
        }

        prepareSubmit(updated, function (err, resultspage) {
          if (err) {
            return handleError(res, err);
          }
          return res.json(200, resultspage);
        });
      });
    });
  });
};

// Deletes a resultspage from the DB.
exports.destroy = function (req, res) {
  Resultspage.findById(req.params.id, function (err, resultspage) {
    if (err) {
      return handleError(res, err);
    }
    if (!resultspage) {
      return res.send(404);
    }

    var originalResultspage = JSON.parse(JSON.stringify(resultspage));
    resultspage.remove(function (err) {
      if (err) {
        return handleError(res, err);
      }

      async.series([
        function (callback) {
          utils.removeConnection(null, originalResultspage._id, true, function (err) {
            if (err) {
              return callback(err);
            }
            return callback();
          });
        },
        function (callback) {
          utils.removeNode(originalResultspage._id, function (err) {
            if (err) {
              return callback(err);
            }
            return callback();
          });
        }
      ], function (err) {
        if (err) {
          return handleError(res, err);
        }
        return res.send(204);
      });
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}

function prepareSubmit(resultspage, callback) {
  resultspage.set('strTags', resultspage.strTag, {strict: false});
  async.series([
    function (cb) {
      Quiz.count({
        $and: [
          {'chartDataModel.nodes.dataId': resultspage._id},
          {status: {$ne: 'test'}}
        ]
      }, function (err, count) {
        if (err) {
          return cb(err);
        }
        count > 0 ? resultspage.set('editable', false, {strict: false}) : resultspage.set('editable', true, {strict: false});
        return cb();
      });
    },
    function (cb) {
      Quiz.count({
        'chartDataModel.nodes.dataId': resultspage._id
      }, function (err, count) {
        if (err) {
          return cb(err);
        }
        console.log(count);
        count > 0 ? resultspage.set('used', true, {strict: false}) : resultspage.set('used', false, {strict: false});
        return cb();
      });
    }
  ], function (err) {
    if (err) {
      return callback(err);
    }
    return callback(null, resultspage);
  });
}
