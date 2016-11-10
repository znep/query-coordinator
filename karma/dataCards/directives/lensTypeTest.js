const angular = require('angular');

describe('lensType', function() {
  'use strict';

  var testHelpers;
  var rootScope;
  var Mockumentary;
  var element = '<lens-type />';

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
    Mockumentary = $injector.get('Mockumentary');
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  it('should render an official lens type when its type is official', function() {
    var scope = rootScope.$new();
    scope.page = Mockumentary.createPage();
    var lensType = testHelpers.TestDom.compileAndAppend(element, scope);
    scope.$$childHead.lensType = 'official';
    scope.$digest();

    // Note that this text is transformed into OFFICIAL by CSS rule
    expect(lensType.find('span:visible').text()).to.equal('official');
  });

  it('should render a community lens type when its type is community', function() {
    var scope = rootScope.$new();
    scope.page = Mockumentary.createPage();
    var lensType = testHelpers.TestDom.compileAndAppend(element, scope);
    scope.$$childHead.lensType = 'community';
    scope.$digest();

    // Note that this text is transformed into COMMUNITY by CSS rule
    expect(lensType.find('span:visible').text()).to.equal('community');
  });
});