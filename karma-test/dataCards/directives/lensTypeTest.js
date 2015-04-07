describe('lensType directive', function() {
  'use strict';

  var testHelpers;
  var rootScope;
  var element = '<lens-type />';

  beforeEach(function() {
    module('dataCards');
    module('/angular_templates/dataCards/lensType.html');
  });

  beforeEach(inject(function($injector) {
    testHelpers = $injector.get('testHelpers');
    rootScope = $injector.get('$rootScope');
  }));

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  it('should render an official lens type when its type is official', function() {
    var scope = rootScope.$new();
    var lensType = testHelpers.TestDom.compileAndAppend(element, scope);
    scope.$$childHead.lensType = 'official';
    scope.$digest();

    expect(lensType.find('span:visible').text()).to.equal('official data lens');
  });

  it('should render a community lens type when its type is community', function() {
    var scope = rootScope.$new();
    var lensType = testHelpers.TestDom.compileAndAppend(element, scope);
    scope.$$childHead.lensType = 'community';
    scope.$digest();

    expect(lensType.find('span:visible').text()).to.equal('community data lens');
  });
});
