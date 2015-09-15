'use strict';

angular.module('quizAppApp')
    .config(function ($stateProvider) {
        $stateProvider
            .state('survey', {
                url: '/s/:id?embed&index',
                templateUrl: 'app/survey/survey.html',
                controller: 'SurveyCtrl',
                resolve: {
                    quiz: function(Quiz, $stateParams) {
                        return Quiz.survey({ id: $stateParams.id }, {}).$promise;
                    }
                }
            }).state('survey_result', {
              url: '/r/:id?embed&index',
              templateUrl: 'app/survey/surveyresult.html',
              controller: 'SurveyResultCtrl',
              resolve: {
                lead: function(Lead, $stateParams) {
                  return Lead.get({ id: $stateParams.id }, {}).$promise;
                }
              }
            });
    });
