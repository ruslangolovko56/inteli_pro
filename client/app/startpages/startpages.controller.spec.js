'use strict';

describe('Controller: StartpagesCtrl', function () {

  // load the controller's module
  beforeEach(module('quizAppApp'));

  var StartpagesCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    StartpagesCtrl = $controller('StartpagesCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
