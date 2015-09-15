'use strict';

var _ = require('lodash');
var Result = require('./result.model');
var ResultsPage = require('../resultspage/resultspage.model');
var Quiz = require('../quiz/quiz.model');
var async = require('async');

// Get list of results
exports.index = function (req, res) {
  var userId = req.user._id;
  Result.find({
    user: userId
  }, function (err, results) {
    if (err) return next(err);
    async.map(results, function (result, callback) {
      prepareSubmit(result, function (err, result) {
        if (err) {
          return callback(err);
        }
        return callback(null, result);
      });
    }, function (err, results) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, results);
    });
  });
};

// Get a single result
exports.show = function (req, res) {
  Result.findById(req.params.id, function (err, result) {
    if (err) {
      return handleError(res, err);
    }
    if (!result) {
      return res.send(404);
    }
    return res.json(result);
  });
};

// Creates a new result in the DB.
exports.create = function (req, res) {
  Result.create(req.body, function (err, result) {
    if (err) {
      return handleError(res, err);
    }
    prepareSubmit(result, function (err, result) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(201, result);
    });
  });
};

// Updates an existing result in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Result.findById(req.params.id, function (err, result) {
    if (err) {
      return handleError(res, err);
    }
    if (!result) {
      return res.send(404);
    }
    var updated = _.merge(result, req.body, function (a, b) {
      return _.isArray(a) ? b : undefined;
    });
    updated.save(function (err) {
      if (err) {
        return handleError(res, err);
      }
      prepareSubmit(updated, function (err, result) {
        if (err) {
          return handleError(res, err);
        }
        return res.json(200, result);
      });
    });
  });
};

// Deletes a result from the DB.
exports.destroy = function (req, res) {
  Result.findById(req.params.id, function (err, result) {
    if (err) {
      return handleError(res, err);
    }
    if (!result) {
      return res.send(404);
    }
    var originalResult = JSON.parse(JSON.stringify(result));
    result.remove(function (err) {
      if (err) {
        return handleError(res, err);
      }

      ResultsPage.find({results: originalResult._id}, function (err, resultsPages) {
        if (err) {
          return handleError(res, err);
        }
        async.each(resultsPages, function (resultsPage, callback) {
          var results = _.filter(resultsPages.results, function (result) {
            return result._id != originalResult._id;
          });
          resultsPage.set('results', undefined);
          resultsPage.set('results', results, {strict: false});
          resultsPage.save(function (err) {
            if (err) {
              return callback(err);
            }
            return callback();
          }, function (err) {
            if (err) {
              return handleError(res, err);
            }
            return res.send(204);
          });
        });
      });

      // deprecated
      //async.series([
      //  function (callback) {
      //    removeConnection(originalResult._id, function (err) {
      //      if (err) {
      //        return callback(err);
      //      }
      //      return callback();
      //    });
      //  },
      //  function (callback) {
      //    removeNode(originalResult._id, function (err) {
      //      if (err) {
      //        return callback(err);
      //      }
      //      return callback();
      //    });
      //  }
      //], function (err) {
      //  if (err) {
      //    return handleError(res, err);
      //  }
      //  return res.send(204);
      //});
    });
  });
};

// Remove nodes.
function removeNode(id, callback) {
  Quiz.find({'chartDataModel.nodes.dataId': id}, function (err, quizzes) {
    if (err) return callback(err);
    if (!quizzes) return callback();
    async.each(quizzes, function (quiz, callbackQ) {
      quiz.chartDataModel.nodes = _.filter(quiz.chartDataModel.nodes, function (node) {
        return node.dataId != id;
      });
      quiz.save(function (err) {
        if (err) {
          return callbackQ(err);
        }
        callbackQ();
      });
    }, function (err) {
      if (err) {
        return callback(err);
      }
      callback();
    });
  });
}

// Remove connections.
function removeConnection(id, callback) {
  Quiz.find({'chartDataModel.nodes.dataId': id}, function (err, quizzes) {
    if (err) return callback(err);
    if (!quizzes) return callback();
    async.each(quizzes, function (quiz, callbackQ) {
      _.forEach(_.filter(JSON.parse(JSON.stringify(quiz.chartDataModel.nodes)), {'dataId': id}), function (node) {
        quiz.chartDataModel.connections = _.filter(quiz.chartDataModel.connections, function (connection) {
          return connection.dest.nodeId != node.id && connection.source.nodeId != node.id;
        });
      });
      quiz.save(function (err) {
        if (err) {
          return callbackQ(err);
        }
        callbackQ();
      });
    }, function (err) {
      if (err) {
        return callback(err);
      }
      callback();
    });
  });
}

// Get survey result.
exports.survey = function (req, res) {
  if (!req.body.results || req.body.results.length == 0) return res.send(404);
  var results = [];
  async.each(req.body.results, function (result, callback) {
    Result.findById(result, function (err, result) {
      if (err) {
        return callback(err);
      }
      if (!result) {
        return callback();
      }
      results.push(result);
      return callback();
    });
  }, function (err) {
    if (err) {
      return handleError(res, err);
    }
    return res.json(results);
  });
};

function handleError(res, err) {
  return res.send(500, err);
}

function prepareSubmit(result, callback) {
  result.set('strTags', result.strTag, {strict: false});

  async.series([
    function (cb) {
      ResultsPage.find({
        'results': result._id
      }, function (err, resultsPages) {
        if (err) {
          return cb(err);
        }

        result.set('editable', true, {strict: false});

        if (resultsPages.length == 0) {
          return cb();
        }

        async.each(resultsPages, function (resultsPage, cb1) {
          Quiz.count({
            $and: [
              {'chartDataModel.nodes.dataId': resultsPage._id},
              {status: {$ne: 'test'}}
            ]
          }, function (err, count) {
            if (err) {
              return cb1(err);
            }

            if (count > 0) {
              result.set('editable', false, {strict: false});
              return cb1();
            }

            return cb1();
          });
        }, function (err) {
          if (err) {
            return cb(err);
          }

          return cb();
        });
      });
    },
    function (cb) {
      ResultsPage.count({
        'results': result._id
      }, function (err, count) {
        if (err) {
          return cb(err);
        }

        count > 0 ? result.set('used', true, {strict: false}) : result.set('used', false, {strict: false});

        return cb();
      });
    }
  ], function (err) {
    if (err) {
      return callback(err);
    }

    return callback(null, result);
  });
}
