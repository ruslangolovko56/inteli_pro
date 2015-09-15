'use strict';

angular.module('quizAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('quizzes', {
        url: '/quizzes',
        templateUrl: 'app/quizzes/quizzes.html',
        controller: 'QuizzesCtrl',
        authenticate: true,
        resolve: {
          quizzes: function (Quiz) {
            return Quiz.query().$promise;
          },
          domain: function (SiteConfig) {
            return SiteConfig.getDomain().$promise;
          },
          questions: function (Question) {
            return Question.query().$promise;
          },
          forms: function (OptInForm) {
            return OptInForm.query().$promise;
          },
          resultsPages: function (ResultsPage) {
            return ResultsPage.query().$promise;
          },
          startPages: function (StartPage) {
            return StartPage.query().$promise;
          },
          results: function (Result) {
            return Result.query().$promise;
          }
        }
      })
      .state('quizzes.add', {
        url: '/add',
        templateUrl: 'app/quizzes/quizzes.add.html',
        controller: 'QuizzesAddCtrl',
        authenticate: true,
        resolve: {
          quiz: function () {
            return;
          },
          startPages: function (StartPage) {
            return StartPage.query().$promise;
          },
          forms: function (OptInForm) {
            return OptInForm.query().$promise;
          },
          questions: function (Question) {
            return Question.query().$promise;
          },
          resultsPages: function (ResultsPage) {
            return ResultsPage.query().$promise;
          },
          markets: function (Market) {
            return Market.query().$promise;
          },
          esps: function (Esp) {
            return Esp.query({includeList: true}).$promise;
          }
        }
      })
      .state('quizzes.edit', {
        url: "/edit/:id",
        templateUrl: "app/quizzes/quizzes.add.html",
        controller: 'QuizzesAddCtrl',
        authenticate: true,
        resolve: {
          quiz: function (Quiz, $stateParams) {
            return Quiz.select({id: $stateParams.id}).$promise;
          },
          startPages: function (StartPage) {
            return StartPage.query().$promise;
          },
          forms: function (OptInForm) {
            return OptInForm.query().$promise;
          },
          questions: function (Question) {
            return Question.query().$promise;
          },
          resultsPages: function (ResultsPage) {
            return ResultsPage.query().$promise;
          },
          markets: function (Market) {
            return Market.query().$promise;
          },
          esps: function (Esp) {
            return Esp.query({includeList: true}).$promise;
          }
        }
      })
      .state('quizzes.view', {
        url: "/view/:id",
        templateUrl: "app/quizzes/quizzes.view.html",
        controller: 'QuizzesViewCtrl',
        authenticate: true,
        resolve: {
          quiz: function (Quiz, $stateParams) {
            return Quiz.select({id: $stateParams.id}).$promise;
          },
          startPages: function (StartPage) {
            return StartPage.query().$promise;
          },
          forms: function (OptInForm) {
            return OptInForm.query().$promise;
          },
          questions: function (Question) {
            return Question.query().$promise;
          },
          resultsPages: function (ResultsPage) {
            return ResultsPage.query().$promise;
          },
          markets: function (Market) {
            return Market.query().$promise;
          },
          esps: function (Esp) {
            return Esp.query({includeList: true}).$promise;
          }
        }
      });
  })
  .factory('Quiz', function ($resource) {
    return $resource('/api/quizzes/:id/:controller', {
        id: '@_id'
      },
      {
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
        },
        survey: {
          method: 'GET',
          isArray: false,
          params: {
            controller: 'survey'
          }
        },
        land: {
          method: 'PUT',
          params: {
            controller: 'land'
          }
        },
        complete: {
          method: 'PUT',
          params: {
            controller: 'complete'
          }
        },
        activate: {
          method: 'PUT',
          params: {
            controller: 'activate'
          }
        },
        deactivate: {
          method: 'PUT',
          params: {
            controller: 'deactivate'
          }
        },
        getStats: {
          method: 'GET',
          params: {
            controller: 'stats'
          }
        },
        getLeads: {
          method: 'GET',
          isArray: true,
          params: {
            controller: 'leads'
          }
        }
      });
  })
  .factory('Market', function ($resource) {
    return $resource('/api/markets/:id/:controller', {
        id: '@_id'
      },
      {
        query: {
          method: 'GET',
          isArray: true
        },
        update: {
          method: 'PUT'
        }
      });
  })
  .factory('SiteConfig', function ($resource) {
    return $resource('/api/site/:controller', {}, {
      getDomain: {
        method: 'GET',
        params: {
          controller: 'domain'
        }
      },
      getFieldTypes: {
        method: 'GET',
        isArray: true,
        params: {
          controller: 'fieldTypes'
        }
      },
    });
  });
