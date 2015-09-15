'use strict';

angular.module('quizAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('questions', {
        url         : '/questions',
        templateUrl : 'app/questions/questions.html',
        controller  : 'QuestionsCtrl',
        authenticate: true,
        resolve     : {
          questions: function (Question) {
            return Question.query().$promise;
          }
        }
      })
      .state('questions.add', {
        url         : "/add",
        templateUrl : "app/questions/questions.add.html",
        controller  : 'QuestionsAddCtrl',
        authenticate: true,
        resolve     : {
          question    : function () {
            return;
          },
          answerFields: function (Field) {
            return;
          }
        }
      })
      .state('questions.edit', {
        url         : "/edit/:id",
        templateUrl : "app/questions/questions.add.html",
        controller  : 'QuestionsAddCtrl',
        authenticate: true,
        resolve     : {
          question    : function (Question, $stateParams) {
            return Question.select({id: $stateParams.id}).$promise;
          },
          answerFields: function (Field) {
            return Field.queryAnswer({id: 0}).$promise;
          }
        }
      });
  })
  .factory('Question', function ($resource) {
    return $resource('/api/questions/:id', {
      id: '@_id'
    }, {
      update: {
        method: 'PUT'
      },
      query : {
        method : 'GET',
        isArray: true
      },
      select: {
        method : 'GET',
        isArray: false
      }
    });
  });
