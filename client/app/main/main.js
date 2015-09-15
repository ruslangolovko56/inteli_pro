'use strict';

angular.module('quizAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('main', {
        url: '/',
        templateUrl: 'app/main/main.html',
        controller: 'MainCtrl',
        authenticate: true,
        resolve: {
          quizzes: function (Quiz) {
            return Quiz.query().$promise;
          },
          domain: function (SiteConfig) {
            return SiteConfig.getDomain().$promise;
          },
          stats: function (Quiz) {
            return Quiz.getStats().$promise;
          }
        }
      });
  });
