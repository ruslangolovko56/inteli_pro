'use strict';

var _ = require('lodash');
var Form = require('./form.model');
var Quiz = require('../quiz/quiz.model');
var async = require('async');
var utils = require('../../components/utils/utils');

// Get list of forms
exports.index = function (req, res) {
  var userId = req.user._id;
  Form.find({
    user: userId
  }, function (err, forms) {
    if (err) return next(err);
    async.map(forms, function (form, callback) {
      prepareSubmit(form, function (err, form) {
        if (err) {
          return callback(err);
        }
        return callback(null, form);
      });
    }, function (err, forms) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, forms);
    });
  });
};

// Get a single form
exports.show = function (req, res) {
  Form.findById(req.params.id).populate('fields').exec(function (err, form) {
    if (err) {
      return handleError(res, err);
    }
    if (!form) {
      return res.send(404);
    }
    return res.json(form);
  });
};

// Creates a new form in the DB.
exports.create = function (req, res) {
  Form.create(req.body, function (err, form) {
    if (err) {
      return handleError(res, err);
    }
    prepareSubmit(form, function (err, form) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(201, form);
    });
  });
};

// Updates an existing form in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Form.findById(req.params.id, function (err, form) {
    if (err) {
      return handleError(res, err);
    }
    if (!form) {
      return res.send(404);
    }
    var updated = _.merge(form, req.body, function (a, b) {
      return _.isArray(a) ? b : undefined;
    });
    updated.save(function (err) {
      if (err) {
        return handleError(res, err);
      }
      prepareSubmit(updated, function (err, form) {
        if (err) {
          return handleError(res, err);
        }
        return res.json(200, form);
      });
    });
  });
};

// Deletes a form from the DB.
exports.destroy = function (req, res) {
  Form.findById(req.params.id, function (err, form) {
    if (err) {
      return handleError(res, err);
    }
    if (!form) {
      return res.send(404);
    }
    //var id = form._id;
    var originalForm = JSON.parse(JSON.stringify(form));
    form.remove(function (err) {
      if (err) {
        return handleError(res, err);
      }

      async.series([
        function (callback) {
          utils.removeConnection(null, originalForm._id, true, function (err) {
            if (err) {
              return callback(err);
            }
            return callback();
          });
        },
        function (callback) {
          utils.removeNode(originalForm._id, function (err) {
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

      // deprecated
      // update changes in quiz.
      //Quiz.find({form: id}, function (err, quizzes) {
      //  if (err) {
      //    return handleError(res, err);
      //  }
      //  if (_.isEmpty(quizzes) || !quizzes) {
      //    return res.send(204);
      //  }
      //  async.each(quizzes, function (quiz, callback) {
      //    quiz.form = undefined;
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

function prepareSubmit(form, callback) {
  form.set('strTags', form.strTag, {strict: false});
  async.series([
    function (cb) {
      Quiz.count({
        $and: [
          {'chartDataModel.nodes.dataId': form._id},
          {status: {$ne: 'test'}}
        ]
      }, function (err, count) {
        if (err) {
          return cb(err);
        }
        count > 0 ? form.set('editable', false, {strict: false}) : form.set('editable', true, {strict: false});
        return cb();
      });
    },
    function (cb) {
      Quiz.count({
        'chartDataModel.nodes.dataId': form._id
      }, function (err, count) {
        if (err) {
          return cb(err);
        }
        count > 0 ? form.set('used', true, {strict: false}) : form.set('used', false, {strict: false});
        return cb();
      });
    }
  ], function (err) {
    if (err) {
      return callback(err);
    }
    return callback(null, form);
  });
}
