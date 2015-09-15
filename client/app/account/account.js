'use strict';

angular.module('quizAppApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('login', {
        url: '/login',
        templateUrl: 'app/account/login/login.html',
        controller: 'LoginCtrl'
      })
      .state('signup', {
        url: '/signup',
        templateUrl: 'app/account/signup/signup.html',
        controller: 'SignupCtrl'
      })
      .state('settings', {
        url: '/settings',
        templateUrl: 'app/account/settings/settings.html',
        controller: 'SettingsCtrl',
        authenticate: true
      })
      .state('settings.profile', {
        url: '/profile',
        templateUrl: 'app/account/settings/settings.profile.html',
        controller: 'SettingsProfileCtrl',
        resolve: {
          user: function (User) {
            return User.get().$promise;
          }
        },
        authenticate: true
      })
      .state('settings.account', {
        url: '/account',
        templateUrl: 'app/account/settings/settings.account.html',
        controller: 'SettingsAccountCtrl',
        authenticate: true
      })
      .state('settings.leadCollection', {
        url: '/lead-collection',
        templateUrl: 'app/account/settings/settings.lead-collection.html',
        controller: 'SettingsLeadCollectionCtrl',
        resolve: {
          esps: function(Esp) {
            return Esp.query().$promise;
          }
        },
        authenticate: true
      })
      .state('settings.formFields', {
        url: '/fields',
        templateUrl: 'app/account/settings/settings.form-fields.html',
        controller: 'SettingsFieldsCtrl',
        authenticate: true
      })
      .state('settings.formFields.system', {
        url: '/system',
        templateUrl: 'app/account/settings/settings.form-fields.system.html',
        controller: 'SettingsSystemFieldsCtrl',
        resolve: {
          systemFields: function(Field) {
            return Field.querySystem({ id: 0 }).$promise;
          },
          fieldTypes: function(SiteConfig) {
            return SiteConfig.getFieldTypes().$promise;
          }
        },
        authenticate: true
      })
      .state('settings.formFields.form', {
        url: '/form',
        templateUrl: 'app/account/settings/settings.form-fields.form.html',
        controller: 'SettingsFormFieldsCtrl',
        resolve: {
          formFields: function(Field) {
            return Field.queryForm({ id: 0 }).$promise;
          },
          fieldTypes: function(SiteConfig) {
            return SiteConfig.getFieldTypes().$promise;
          }
        },
        authenticate: true
      })
      .state('settings.formFields.answer', {
        url: '/answer',
        templateUrl: 'app/account/settings/settings.form-fields.answer.html',
        controller: 'SettingsAnswerFieldsCtrl',
        resolve: {
          answerFields: function(Field) {
            return Field.queryAnswer({ id: 0 }).$promise;
          },
          fieldTypes: function(SiteConfig) {
            return SiteConfig.getFieldTypes().$promise;
          }
        },
        authenticate: true
      })
      .state('settings.socialSharing', {
        url: '/social-sharing',
        templateUrl: 'app/account/settings/settings.social-sharing.html',
        controller: 'SettingsSocialSharingCtrl',
        authenticate: true
      })
      .state('settings.markets', {
        url: '/markets',
        templateUrl: 'app/account/settings/settings.markets.html',
        controller: 'SettingsMarketsCtrl',
        resolve: {
          markets: function(Market) {
            return Market.query().$promise;
          }
        },
        authenticate: true
      });
  })
  .factory('Esp', function ($resource) {
    return $resource('/api/esps/:id/:controller', {
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
      },
      authenticate: {
        method: 'POST',
        isArray: false,
        params: {
          controller: 'auth'
        }
      },
      queryFields: {
        method: 'GET',
        isArray: true,
        params: {
          controller: 'fields'
        }
      },
      queryMapping: {
        method: 'GET',
        isArray: true,
        params: {
          controller: 'fieldmapping'
        }
      },
      saveMapping: {
        method: 'POST',
        isArray: false,
        params: {
          controller: 'fieldmapping'
        }
      },
      createFields: {
        method: 'POST',
        isArray: true,
        params: {
          controller: 'fields'
        }
      },
      cancelConnection: {
        method: 'DELETE',
        isArray: false,
        params: {
          controller: 'espconnection'
        }
      }
    });
  })
  .factory('Field', function ($resource) {
    return $resource('/api/fields/:id/:controller', {
      id: '@_id'
    }, {
      update: {
        method: 'PUT'
      },
      query: {
        method: 'GET',
        isArray: true
      },
      queryFormFields: {
        method: 'GET',
        isArray: true,
        params: {
          controller: 'form'
        }
      },
      select: {
        method: 'GET',
        isArray: false
      },
      queryAll: {
        method: 'GET',
        isArray: true,
        params: {
          controller: 'all'
        }
      },
      queryCustom: {
        method: 'GET',
        isArray: true,
        params: {
          controller: 'custom'
        }
      },
      querySystem: {
        method: 'GET',
        isArray: true,
        params: {
          controller: 'system'
        }
      },
      queryForm: {
        method: 'GET',
        isArray: true,
        params: {
          controller: 'form'
        }
      },
      queryAnswer: {
        method: 'GET',
        isArray: true,
        params: {
          controller: 'answer'
        }
      },
      queryFromParam: {
        method: 'POST',
        isArray: true,
        params: {
          controller: 'queryByParams'
        }
      }
    });
  });
