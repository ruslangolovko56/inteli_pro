'use strict';

var _ = require('lodash');
var Quiz = require('./quiz.model');
var Question = require('../question/question.model');
var Result = require('../result/result.model');
var ResultsPage = require('../resultspage/resultspage.model');
var Startpage = require('../startpage/startpage.model');
var Form = require('../form/form.model');
var Lead = require('../lead/lead.model');
var Field = require('../field/field.model');
var Fieldmapping = require('../esp/fieldmapping.model');
var Esp = require('../esp/esp.model');
var async = require('async');

// Get list of quizs
exports.index = function (req, res) {
  var userId = req.user._id;
  Quiz.find({user: userId}).lean().exec(function (err, quizzes) {
    if (err) return next(err);
    async.map(quizzes, function (quiz, callback) {
      prepareSubmit(quiz, function (err, quiz) {
        if (err) {
          return callback(err);
        }
        return callback(null, quiz);
      });
    }, function (err, quizzes) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200, quizzes);
    });
  });
};

// Get a single quiz
exports.show = function (req, res) {
  Quiz.findById(req.params.id).lean().exec(function (err, quiz) {
    if (err) {
      return handleError(res, err);
    }
    if (!quiz) {
      return res.send(404);
    }
    // Construct nodes of data model.
    async.each(quiz.chartDataModel.nodes, function (node, callback) {
      if (node.type == 'question') {
        // Question node.
        Question.findById(node.dataId, 'text answers', function (err, question) {
          console.log('---question---');
          if (err) return callback(err);
          if (!question) return callback('404');
          node.name = question.text;
          node.inputConnectors = [
            {}
          ];
          var id = 0;
          var outputConnectors = [];
          question.answers.forEach(function (answer) {
            var outputConnector = {};
            id++;
            outputConnector.name = id;
            outputConnector.description = answer.text;
            outputConnector.dataId = answer._id;
            outputConnectors.push(outputConnector);
          });
          node.outputConnectors = outputConnectors;
          return callback();
        });
      } else if (node.type == 'resultsPage') {
        console.log('---results page---');
        // Result node.
        ResultsPage.findById(node.dataId, 'name', function (err, result) {
          if (err) return callback(err);
          if (!result) return callback('404');
          node.name = result.name;
          node.inputConnectors = [
            {}
          ];
          node.outputConnectors = [
            {}
          ];
          return callback();
        });
      } else if (node.type == 'esp') {
        // Result node.
        Esp.findById(node.dataId, 'name', function (err, result) {
          console.log('---esp---');
          if (err) return callback(err);
          if (!result) return callback('404');
          node.name = result.name;
          node.inputConnectors = [
            {}
          ];
          node.outputConnectors = [
            {}
          ];
          return callback();
        });
      } else if (node.type == 'startPage') {
        // Result node.
        Startpage.findById(node.dataId, 'title', function (err, result) {
          console.log('---start page---');
          if (err) return callback(err);
          if (!result) return callback('404');
          node.name = result.title;
          node.inputConnectors = [
            {}
          ];
          node.outputConnectors = [
            {}
          ];
          return callback();
        });
      } else if (node.type == 'form') {
        // Result node.
        Form.findById(node.dataId, 'title', function (err, result) {
          console.log('---form---');
          if (err) return callback(err);
          if (!result) return callback('404');
          node.name = result.title;
          node.inputConnectors = [
            {}
          ];
          node.outputConnectors = [
            {}
          ];
          return callback();
        });
      } else {
        return callback('Invalid node type');
      }
    }, function (err) {
      if (err) {
        console.log(err);
        return handleError(res, err);
      }
      // Construct connections.
      var connections = [];
      quiz.chartDataModel.connections.forEach(function (connection) {
        var newCon = {};
        newCon.source = {};
        newCon.source.nodeID = connection.source.nodeId;
        if (connection.source.connectorId) {
          var node = _.findWhere(quiz.chartDataModel.nodes, {id: connection.source.nodeId});
          if (node) {
            newCon.source.connectorIndex = _.findIndex(node.outputConnectors, {dataId: connection.source.connectorId});
          }
        } else {
          newCon.source.connectorIndex = 0;
        }
        newCon.dest = {};
        newCon.dest.nodeID = connection.dest.nodeId;
        newCon.dest.connectorIndex = 0;
        connections.push(newCon);
      });
      quiz.chartDataModel.connections = connections;
      // Return result.
      return res.json(quiz);
    });
  });
};

// Creates a new quiz in the DB.
exports.create = function (req, res) {
  Quiz.create(req.body, function (err, quiz) {
    if (err) {
      return handleError(res, err);
    }
    prepareSubmit(quiz, function (err, quiz) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(201, quiz);
    });
  });
};

// Updates an existing quiz in the DB.
exports.update = function (req, res) {
  if (req.body._id) {
    delete req.body._id;
  }
  Quiz.findById(req.params.id, function (err, quiz) {
    if (err) {
      return handleError(res, err);
    }
    if (!quiz) {
      return res.send(404);
    }

    var updated = _.merge(quiz, req.body, function (a, b) {
      return _.isArray(a) ? b : undefined;
    });
    updated.save(function (err) {
      if (err) {
        return handleError(res, err);
      }
      prepareSubmit(JSON.parse(JSON.stringify(updated)), function (err, quiz) {
        if (err) {
          return handleError(res, err);
        }
        return res.json(200, quiz);
      });
    });
  });
};

// Deletes a quiz from the DB.
exports.destroy = function (req, res) {
  Quiz.findById(req.params.id, function (err, quiz) {
    if (err) {
      return handleError(res, err);
    }
    if (!quiz) {
      return res.send(404);
    }

    quiz.remove(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.send(204);
    });
  });
};

// Updates landed field in a existing quiz.
exports.land = function (req, res) {
  Quiz.findById(req.params.id, function (err, quiz) {
    if (err) {
      return handleError(res, err);
    }
    if (!quiz) {
      return res.send(404);
    }
    quiz.landed += 1;
    quiz.save(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200);
    });
  });
};

// Update completed field in a existing quiz.
exports.complete = function (req, res) {
  Quiz.findById(req.params.id, function (err, quiz) {
    if (err) {
      return handleError(res, err);
    }
    if (!quiz) {
      return res.send(404);
    }
    quiz.completed += 1;
    quiz.save(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200);
    });
  });
};

// Activate quiz status.
exports.activate = function (req, res) {
  var userId = req.user._id;

  // query quiz from id
  Quiz.findById(req.params.id, function (err, quiz) {
    if (err) {
      return handleError(res, err);
    }

    if (!quiz) {
      return res.send(404);
    }

    if (quiz.status == 'test') {

      // if activate from test
      if (!quiz.validateDataModel()) {
        return res.send(403);
      }

      quiz.validateFieldMapping(function (err, valid) {
        if (err) {
          return handleError(res, err);
        }

        if (!valid) {
          return res.send(403);
        }

        // Check if esp fields are mapped
        async.each(quiz.chartDataModel.nodes, function (node, callback) {
          if (node.type == 'esp') {
            Fieldmapping.count({user: userId, esp: node.dataId, 'list.id': node.meta.list.id}, function (err, count) {
              if (err) {
                return callback(err);
              }
              if (count == 1) {
                return callback();
              } else {
                return callback(403);
              }
            });
          } else {
            return callback();
          }
        }, function (err) {
          if (err == 403) {
            return res.send(403);
          } else if (err) {
            return handleError(res, err);
          }

          // save quiz activate status
          quiz.startedAt = new Date();
          quiz.status = 'active';
          quiz.save(function (err) {
            if (err) {
              return handleError(res, err);
            }
            return res.json(200);
          });
        });
      });
    } else {
      // if activate from deactivate status
      quiz.status = 'active';
      quiz.save(function (err) {
        if (err) {
          return handleError(res, err);
        }
        return res.json(200);
      });
    }
  });
};

// Deactivate quiz status.
exports.deactivate = function (req, res) {
  Quiz.findById(req.params.id, function (err, quiz) {
    if (err) {
      return handleError(res, err);
    }
    if (!quiz) {
      return res.send(404);
    }
    quiz.status = 'inactive';
    quiz.save(function (err) {
      if (err) {
        return handleError(res, err);
      }
      return res.json(200);
    });
  });
};

// Select quiz for survey.
exports.survey = function (req, res) {
  Quiz.findById(req.params.id).lean().exec(function (err, quiz) {
    if (err) {
      return handleError(res, err);
    }

    if (!quiz || quiz.status == 'inactive') {
      return res.send(404);
    }

    var startPage = _.find(quiz.chartDataModel.nodes, function (node) {
      return node.type == 'startPage';
    });

    if (startPage) {
      Startpage.findById(startPage.dataId, function (err, startPage) {
        if (err) {
          return handleError(res, err);
        }

        if (!startPage) {
          return res.send(404);
        }

        quiz.startPage = startPage;

        return res.json(quiz);
      });
    } else {
      return res.json(quiz);
    }
  });
};

// Get total/monthly/weekly leads count based on user id.
exports.getStats = function (req, res) {
  var userId = req.user._id;

  Quiz.find({user: userId, status: {$ne: 'test'}}, '_id', function (err, quizzes) {
    if (err) {
      return handleError(res, err);
    }

    var ids = _.pluck(quizzes, '_id');
    var date = new Date();
    var firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    var firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    var first = date.getDate() - date.getDay();
    var firstDayOfWeek = new Date(date.setDate(first));

    async.parallel({
      countYear : function (callback) {
        Lead.count({quiz: {$in: ids}, created: {$gte: firstDayOfYear}, completed: true}, function (err, countYear) {
          if (err) {
            return callback(err);
          }
          return callback(null, countYear);
        });
      },
      countMonth: function (callback) {
        Lead.count({quiz: {$in: ids}, created: {$gte: firstDayOfMonth}, completed: true}, function (err, countMonth) {
          if (err) {
            return callback(err);
          }
          return callback(null, countMonth);
        });
      },
      countWeek : function (callback) {
        Lead.count({quiz: {$in: ids}, created: {$gte: firstDayOfWeek}, completed: true}, function (err, countWeek) {
          if (err) {
            return callback(err);
          }
          return callback(null, countWeek);
        });
      },
      graphData : function (callback) {
        Lead.aggregate([{
          $match: {
            quiz: {$in: ids},
            completed: true
          }
        }, {$sort: {created: -1}}, {
          $group: {
            _id      : {
              "$subtract": [
                {"$subtract": ["$created", new Date("1970-01-01")]},
                {
                  "$mod": [
                    {"$subtract": ["$created", new Date("1970-01-01")]},
                    1000 * 60 * 60 * 24
                  ]
                }
              ]
            },
            leadCount: {$sum: 1}
          }
        }], function (err, result) {
          if (err) {
            console.log(err);
            return callback(err);
          }
          return callback(null, result);
        })
      }
    }, function (err, results) {
      if (err) {
        return handleError(res, err);
      }
      res.json(200, results);
    });
  })
}

function handleError(res, err) {
  return res.send(500, err);
}

function prepareSubmit(quiz, callback) {
  Lead.count({quiz: quiz._id, completed: true}, function (err, count) {
    if (err) {
      return callback(err);
    }
    quiz.leadCount = count;
    Lead.findOne({quiz: quiz._id}, {}, {sort: {'created': -1}}, function (err, lead) {
      if (err) {
        return callback(err);
      }
      if (!lead) {
        return callback(null, quiz);
      }
      quiz.lastLead = lead.created;
      return callback(null, quiz);
    });
  });
}
