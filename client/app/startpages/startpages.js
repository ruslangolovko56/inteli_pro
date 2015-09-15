'use strict';

angular.module('quizAppApp')
    .config(function ($stateProvider) {
        $stateProvider
            .state('startpages', {
                url: '/startpages',
                templateUrl: 'app/startpages/startpages.html',
                controller: 'StartpagesCtrl',
                authenticate: true,
                resolve: {
                    startPages: function (StartPage) {
                        return StartPage.query().$promise;
                    }
                }
            })
            .state('startpages.add', {
                url: "/add",
                templateUrl: "app/startpages/startpages.add.html",
                controller: 'StartPagesAddCtrl',
                authenticate: true,
                resolve: {
                    startPage: function() {
                        return;
                    }
                }
            })
            .state('startpages.edit', {
                url: "/edit/:id",
                templateUrl: "app/startpages/startpages.add.html",
                controller: 'StartPagesAddCtrl',
                authenticate: true,
                resolve: {
                    startPage: function(StartPage, $stateParams) {
                        return StartPage.select({ id: $stateParams.id }).$promise;
                    }
                }
            });
    })
    .factory('StartPage', function ($resource) {
        return $resource('/api/startpages/:id', {
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