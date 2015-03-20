describe('httpDecorator', function() {
  'use strict';

  var testHelpers;
  var $httpBackend;
  var $rootScope;
  var decoratorModule;

  beforeEach(module('socrataCommon.decorators'));
  beforeEach(function(){
    decoratorModule = angular.module('httpDecoratorTestModule', ['socrataCommon.decorators'])
    // console.log('')
    decoratorModule.config(function($provide, assetRevisionKeyProvider){
      assetRevisionKeyProvider($provide, 'assetRevisionKey')
    })
  });
  beforeEach(module('test'));
  beforeEach(module('socrataCommon.services'));
  beforeEach(module('dataCards.directives'));
  beforeEach(module('httpDecoratorTestModule'));

  beforeEach(function() {
    inject(function($injector) {
      testHelpers = $injector.get('testHelpers');
      $rootScope = $injector.get('$rootScope');
      $httpBackend = $injector.get('$httpBackend');

      $httpBackend.expectGET('/angular_templates/dataCards/spinner.html?assetRevisionKey').respond('')
    });
  });


  it('asdlkfjasldf', function() {
    var html = '<spinner></spinner>';
    var element = testHelpers.TestDom.compileAndAppend(html, $rootScope);
    $httpBackend.verifyNoOutstandingExpectation();
  });
});
