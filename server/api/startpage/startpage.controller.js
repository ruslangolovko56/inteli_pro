'use strict';

var _ = require('lodash');
var Startpage = require('./startpage.model');
var Quiz = require('../quiz/quiz.model');
var async = require('async');
var utils = require('../../components/utils/utils');

// Get list of startpages
exports.index = function (req, res) {
  var userId = req.user._id;
  Startpage.find({
    user: userId
  }, function (err, startPages) {
    if (err) return next(err);
    async.map(startPages, function (startPage, callback) {
      prepareSubmit(startPage, function (err, startPage) {
        if (err) {
          return callback(err);
        }
        return callback(null, startPage);
      });
    }, function (err, startPages) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, startPages);
    });
  });
};

// Get a single startpage
exports.show = function (req, res) {
  Startpage.findById(req.params.id, function (err, startpage) {
    if (err) {
      return handleError(res, err);
    }
    if (!startpage) {
      return res.send(404);
    }
    return res.json(startpage);
  });
};

// Creates a new startpage in the DB.
exports.create = function (req, res) {
  Startpage.create(req.body, function (err, startPage) {
    if (err) {
      return handleError(res, err);
    }
    prepareSubmit(startPage, function (err, startPage) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(201, startPage);
    });
  });
};

// Updates an existing startpage in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Startpage.findById(req.params.id, function (err, startpage) {
    if (err) {
      return handleError(res, err);
    }
    if (!startpage) {
      return res.send(404);
    }
    var updated = _.merge(startpage, req.body, function (a, b) {
      return _.isArray(a) ? b : undefined;
    });
    updated.save(function (err) {
      if (err) {
        return handleError(res, err);
      }
      prepareSubmit(updated, function (err, startPage) {
        if (err) {
          return handleError(res, err);
        }
        return res.json(200, startpage);
      });
    });
  });
};

// Deletes a startpage from the DB.
exports.destroy = function (req, res) {
  Startpage.findById(req.params.id, function (err, startpage) {
    if (err) {
      return handleError(res, err);
    }
    if (!startpage) {
      return res.send(404);
    }
    //var id = startpage._id;
    var originalStartpage = JSON.parse(JSON.stringify(startpage));
    startpage.remove(function (err) {
      if (err) {
        return handleError(res, err);
      }

      async.series([
        function (callback) {
          utils.removeConnection(null, originalStartpage._id, true, function (err) {
            if (err) {
              return callback(err);
            }
            return callback();
          });
        },
        function (callback) {
          utils.removeNode(originalStartpage._id, function (err) {
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

      // deprecated.
      // update changes in quiz.
      //Quiz.find({startPage: id}, function (err, quizzes) {
      //  if (err) {
      //    return handleError(res, err);
      //  }
      //  if (_.isEmpty(quizzes) || !quizzes) {
      //    return res.send(204);
      //  }
      //  async.each(quizzes, function (quiz, callback) {
      //    quiz.startPage = undefined;
      //    quiz.save(function (err) {
      //      if (err) {
      //        return callback(err);
      //      }
      //      return callback();
      //    });
      //  }, function (err) {
      //    if (err) {
      //      return handleError(res, err);
      //    }
      //    return res.send(204);
      //  });
      //});
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}

function prepareSubmit(startPage, callback) {
  startPage.set('strTags', startPage.strTag, {strict: false});
  async.series([
    function (cb) {
      Quiz.count({
        $and: [
          {'chartDataModel.nodes.dataId': startPage._id},
          {status: {$ne: 'test'}}
        ]
      }, function (err, count) {
        if (err) {
          return cb(err);
        }
        count > 0 ? startPage.set('editable', false, {strict: false}) : startPage.set('editable', true, {strict: false});
        return cb();
      });
    },
    function (cb) {
      Quiz.count({
        'chartDataModel.nodes.dataId': startPage._id
      }, function (err, count) {
        if (err) {
          return cb(err);
        }
        count > 0 ? startPage.set('used', true, {strict: false}) : startPage.set('used', false, {strict: false});
        return cb();
      });
    }
  ], function (err) {
    if (err) {
      return callback(err);
    }
    return callback(null, startPage);
  });
}
