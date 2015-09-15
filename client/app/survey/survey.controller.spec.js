'use strict';

describe('Controller: SurveyCtrl', function () {

  // load the controller's module
  beforeEach(module('quizAppApp'));

  var SurveyCtrl, scope;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope) {
    scope = $rootScope.$new();
    SurveyCtrl = $controller('SurveyCtrl', {
      $scope: scope
    });
  }));

  it('should ...', function () {
    expect(1).toEqual(1);
  });
});
