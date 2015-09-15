'use strict';

angular.module('quizAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('results', {
        url: '/results',
        templateUrl: 'app/results/results.html',
        controller: 'ResultsCtrl',
        authenticate: true,
        resolve: {
          results: function (Result) {
            return Result.query().$promise;
          }
        }
      })
      .state('results.add', {
        url: "/add",
        templateUrl: "app/results/results.add.html",
        controller: 'ResultsAddCtrl',
        authenticate: true,
        resolve: {
          result: function () {
            return;
          }
        }
      })
      .state('results.edit', {
        url: "/edit/:id",
        templateUrl: "app/results/results.add.html",
        controller: 'ResultsAddCtrl',
        authenticate: true,
        resolve: {
          result: function (Result, $stateParams) {
            return Result.select({id: $stateParams.id}).$promise;
          }
        }
      })
      .state('resultspages', {
        url: '/results-pages',
        templateUrl: 'app/results/results-pages.html',
        controller: 'ResultsPagesCtrl',
        authenticate: true,
        resolve: {
          resultsPages: function (ResultsPage) {
            return ResultsPage.query().$promise;
          }
        }
      })
      .state('resultspages.add', {
        url: '/add',
        templateUrl: 'app/results/results-pages.add.html',
        controller: 'ResultsPagesAddCtrl',
        authenticate: true,
        resolve: {
          resultsPage: function (ResultsPage) {
            return;
          },
          results: function (Result) {
            return Result.query().$promise;
          }
        }
      })
      .state('resultspages.edit', {
        url: '/edit/:id',
        templateUrl: 'app/results/results-pages.add.html',
        controller: 'ResultsPagesAddCtrl',
        authenticate: true,
        resolve: {
          resultsPage: function (ResultsPage, $stateParams) {
            return ResultsPage.select({id: $stateParams.id}).$promise;
          },
          results: function (Result) {
            return Result.query().$promise;
          }
        }
      });
  })
  .factory('Result', function ($resource) {
    return $resource('/api/results/:id/:controller', {
      id: '@_id'
    }, {
      update: {
        method: 'PUT'
      },
      query: {
        method: 'GET',
        isArray: true
      },
      survey: {
        method: 'POST',
        isArray: true,
        params: {
          controller: 'survey'
        }
      },
      select: {
        method: 'GET',
        isArray: false
      }
    });
  })
  .factory('ResultsPage', function ($resource) {
    return $resource('/api/resultspages/:id/:controller', {
      id: '@_id'
    }, {
      update: {
        method: 'PUT'
      },
      query: {
        method: 'GET',
        isArray: true
      },
      select: {
        method: 'GET',
        isArray: false
      }
    });
  });
