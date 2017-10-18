import { expect, assert } from 'chai';
const angular = require('angular');

describe('socSelect', function() {
  'use strict';

  var testHelpers;
  var $rootScope;

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));
  require('app/styles/dataCards/cards.scss');

  beforeEach(function() {
    inject(function($injector) {
      testHelpers = $injector.get('testHelpers');
      $rootScope = $injector.get('$rootScope');
    });
  });

  afterEach(function() {
    testHelpers.TestDom.clear();
  });

  it('should compile to a select', function() {
    var scope = $rootScope.$new();
    var element = testHelpers.TestDom.compileAndAppend('<soc-select></soc-select>', scope);
    expect(element.find('select').length).to.equal(1);
  });

  it('should overlay the custom arrow over the select\'s default one', function() {
    var scope = $rootScope.$new();
    var element = testHelpers.TestDom.compileAndAppend('<soc-select></soc-select>', scope);
    var arrow = element.children('.arrow-container');
    var arrowPosition = arrow.offset();
    // If pointer-events:none, elementFromPoint doesn't detect it. So unset it for now
    arrow.css('pointer-events', 'inherit');
    var topElement = document.elementFromPoint(arrowPosition.left + 2, arrowPosition.top + 2);
    expect(topElement).to.equal(arrow[0]);
  });

  it('should pass the model through', function() {
    var scope = $rootScope.$new();
    var fakeModel = new Object();
    scope.m = fakeModel;
    var element = testHelpers.TestDom.compileAndAppend(
      '<soc-select ng-model="m"></soc-select>', scope
    );
    expect(element.find('select').scope().ngModel).to.equal(fakeModel);
  });
});
