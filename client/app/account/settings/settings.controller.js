'use strict';

angular.module('quizAppApp')
  .controller('SettingsCtrl', function ($scope, User, Auth, $state) {
    $scope.isMenuActive = function(tab) {
      return $state.includes('settings.' + tab);
    };
  });
