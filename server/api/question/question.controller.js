'use strict';

var _ = require('lodash');
var Question = require('./question.model');
var Quiz = require('../quiz/quiz.model');
var async = require('async');
var Field = require('../field/field.model');
var utils = require('../../components/utils/utils');

// Get list of questions
exports.index = function (req, res) {
  var userId = req.user._id;
  Question.find({
    user: userId
  }).exec(function (err, questions) {
    if (err) return next(err);
    async.map(questions, function (question, callback) {
      prepareSubmit(question, function (err, question) {
        if (err) {
          return callback(err);
        }
        return callback(null, question);
      });
    }, function (err, questions) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, questions);
    });
  });
};

// Get a single question
exports.show = function (req, res) {
  Question.findById(req.params.id).lean().exec(function (err, question) {
    if (err) {
      return handleError(res, err);
    }
    if (!question) {
      return res.send(404);
    }

    question.answers.forEach(function (answer) {
      if (answer.enable == undefined){
        answer.enable = true;
      }
    });

    async.map(question.answers, function (answer, callback) {
      //Field.populate(answer.fields, {
      //  path: 'field'
      //}, function(err, answer) {
      //  if(err) {
      //    return callback(err);
      //  }
      //  answer.fields = _.map(answer.fields, function(field) {
      //    field.field.value = field.value;
      //    return field.field;
      //  });
      //  return callback(null, answer);
      //})
      async.map(answer.fields, function (field, cb) {
        Field.populate(field, {path: 'field'}, function (err, field) {
          if (err) {
            return cb(err);
          }
          return cb(null, field);
        });
      }, function (err, fields) {
        if (err) {
          return callback(err);
        }
        answer.fields = _.map(fields, function (field) {
          var f = JSON.parse(JSON.stringify(field.field));
          f.value = field.value;
          return f;
        });
        return callback(null, answer);
      });
    }, function (err, answers) {
      if (err) {
        return handleError(res, err);
      }
      question.answers = answers;
      return res.json(question)
    });

  });
};

// Creates a new question in the DB.
exports.create = function (req, res) {
  Question.create(req.body, function (err, question) {
    if (err) {
      return handleError(res, err);
    }
    prepareSubmit(question, function (err, question) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(201, question);
    });
  });
};

// Updates an existing question in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }

  Question.findById(req.params.id, function (err, question) {
    if (err) {
      return handleError(res, err);
    }
    if (!question) {
      return res.send(404);
    }
    var originalQuestion = JSON.parse(JSON.stringify(question));
    question.set(req.body);
    question.save(function (err) {
      if (err) {
        return handleError(res, err);
      }
      // Update changes in quiz.
      var savedQuestion = JSON.parse(JSON.stringify(question));
      var answers = _.remove(originalQuestion.answers, function (answer) {
        return _.findIndex(savedQuestion.answers, {_id: answer._id}) == -1;
      });
      utils.removeConnection(answers, question._id, false, function (err) {
        if (err) {
          return handleError(res, err);
        }
        prepareSubmit(question, function (err, question) {
          if (err) {
            return handleError(res, err);
          }
          return res.json(200, question);
        });
      });
    });
  });
};

// Deletes a question from the DB.
exports.destroy = function (req, res) {
  Question.findById(req.params.id, function (err, question) {
    if (err) {
      return handleError(res, err);
    }
    if (!question) {
      return res.send(404);
    }
    var originalQuestion = JSON.parse(JSON.stringify(question));
    question.remove(function (err) {
      if (err) {
        return handleError(res, err);
      }
      async.series([
        function (callback) {
          utils.removeConnection(originalQuestion.answers, originalQuestion._id, true, function (err) {
            if (err) {
              return callback(err);
            }
            return callback();
          });
        },
        function (callback) {
          utils.removeNode(originalQuestion._id, function (err) {
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
function removeConnection(answers, id, isDelete, callback) {
  Quiz.find({'chartDataModel.nodes.dataId': id}, function (err, quizzes) {
    if (err) return callback(err);
    if (!quizzes) return callback();
    async.each(quizzes, function (quiz, callbackQ) {
      if (isDelete) {
        _.forEach(_.filter(JSON.parse(JSON.stringify(quiz.chartDataModel.nodes)), {'dataId': id}), function (node) {
          quiz.chartDataModel.connections = _.filter(quiz.chartDataModel.connections, function (connection) {
            return connection.dest.nodeId != node.id;
          });
        });
      }
      quiz.chartDataModel.connections = _.filter(quiz.chartDataModel.connections, function (connection) {
        return connection.source.connectorId && _.findIndex(answers, {'_id': connection.source.connectorId.toString()}) == -1;
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

function handleError(res, err) {
  return res.send(500, err);
}

function prepareSubmit(question, callback) {
  question.set('strTags', question.strTag, {strict: false});
  async.series([
    function (cb) {
      Quiz.count({
        $and: [
          {'chartDataModel.nodes.dataId': question._id},
          {status: {$ne: 'test'}}
        ]
      }, function (err, count) {
        if (err) {
          return cb(err);
        }
        count > 0 ? question.set('editable', false, {strict: false}) : question.set('editable', true, {strict: false});
        return cb();
      });
    },
    function (cb) {
      Quiz.count({
        'chartDataModel.nodes.dataId': question._id
      }, function (err, count) {
        if (err) {
          return cb(err);
        }
        count > 0 ? question.set('used', true, {strict: false}) : question.set('used', false, {strict: false});
        return cb();
      });
    }
  ], function (err) {
    if (err) {
      return callback(err);
    }
    return callback(null, question);
  });
}
