'use strict';

var Quiz = require('../../api/quiz/quiz.model');
var async = require('async');
var _ = require('lodash');

// Remove nodes.
exports.removeNode = function (id, callback) {
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
};

// Remove connections.
exports.removeConnection = function (answers, id, isDelete, callback) {
  Quiz.find({'chartDataModel.nodes.dataId': id}, function (err, quizzes) {
    if (err) return callback(err);
    if (!quizzes) return callback();
    async.each(quizzes, function (quiz, callbackQ) {
      if (isDelete) {
        console.log('delete connection');
        _.forEach(_.filter(JSON.parse(JSON.stringify(quiz.chartDataModel.nodes)), {'dataId': id}), function (node) {
          quiz.chartDataModel.connections = _.filter(quiz.chartDataModel.connections, function (connection) {
            return connection.dest.nodeId != node.id && connection.source.nodeId != node.id;
          });
        });
      }

      quiz.chartDataModel.connections = _.filter(quiz.chartDataModel.connections, function (connection) {
        if(connection.source.connectorId) {
          return _.findIndex(answers, {'_id': connection.source.connectorId.toString()}) == -1;
        } else {
          return true;
        }
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
};
