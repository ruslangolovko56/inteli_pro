'use strict';

describe('Controller: LeadsCtrl', function () {

  // load the controller's module
  beforeEach(module('quizAppApp'));

  var LeadsCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    LeadsCtrl = $controller('LeadsCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
