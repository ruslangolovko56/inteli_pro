'use strict';

angular.module('quizAppApp')
    .config(function ($stateProvider) {
        $stateProvider
            .state('forms', {
                url: '/forms',
                templateUrl: 'app/forms/forms.html',
                controller: 'FormsCtrl',
                authenticate: true,
                resolve: {
                    forms: function (OptInForm) {
                        return OptInForm.query().$promise;
                    }
                }
            })
            .state('forms.add', {
                url: "/add",
                templateUrl: "app/forms/forms.add.html",
                controller: 'FormsAddCtrl',
                authenticate: true,
                resolve: {
                    form: function () {
                        return;
                    },
                    fields: function (Field) {
                        return Field.queryFormFields().$promise;
                    }
                }
            })
            .state('forms.edit', {
                url: "/edit/:id",
                templateUrl: "app/forms/forms.add.html",
                controller: 'FormsAddCtrl',
                authenticate: true,
                resolve: {
                    form: function (OptInForm, $stateParams) {
                        return OptInForm.select({ id: $stateParams.id }).$promise;
                    },
                    fields: function (Field) {
                        return Field.queryFormFields().$promise;
                    }
                }
            });
    })
    .factory('OptInForm', function ($resource) {
        return $resource('/api/forms/:id', {
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
