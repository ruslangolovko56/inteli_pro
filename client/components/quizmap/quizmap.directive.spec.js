'use strict';

describe('Directive: quizmap', function () {

  // load the directive's module and view
  beforeEach(module('quizAppApp'));
  beforeEach(module('components/quizmap/quizmap.html'));

  var element, scope;

  beforeEach(inject(function ($rootScope) {
    scope = $rootScope.$new();
  }));

  it('should make hidden element visible', inject(function ($compile) {
    element = angular.element('<quizmap></quizmap>');
    element = $compile(element)(scope);
    scope.$apply();
    expect(element.text()).toBe('this is the quizmap directive');
  }));
});