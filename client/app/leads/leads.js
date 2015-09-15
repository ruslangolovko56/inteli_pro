'use strict';

angular.module('quizAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('leads', {
        url         : '/leads',
        templateUrl : 'app/leads/leads.html',
        controller  : 'LeadsCtrl',
        authenticate: true,
        resolve     : {
          quizzes: function (Quiz) {
            return Quiz.query().$promise;
          },
          fields : function (Field) {
            return Field.query().$promise;
          }
        }
      });
  })
  .factory('Lead', function ($resource) {
    return $resource('/api/leads/:id/:controller', {
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
      },
      finish: {
        method : 'PUT',
        isArray: false,
        params : {
          controller: 'finish'
        }
      }
    });
  });

