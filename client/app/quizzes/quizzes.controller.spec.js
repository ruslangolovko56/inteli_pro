'use strict';

describe('Controller: QuizzesCtrl', function () {

  // load the controller's module
  beforeEach(module('quizAppApp'));

  var QuizzesCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    QuizzesCtrl = $controller('QuizzesCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
