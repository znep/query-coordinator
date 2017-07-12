import { expect, assert } from 'chai';
const angular = require('angular');

describe('axisRescalingToggle', function() {
  'use strict';

  var $rootScope;
  var testHelpers;
  var Mockumentary;
  var ServerConfig;

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(function() {
    inject(function($injector) {
      $rootScope = $injector.get('$rootScope');
      testHelpers = $injector.get('testHelpers');
      Mockumentary = $injector.get('Mockumentary');
      ServerConfig = $injector.get('ServerConfig');
    });
  });

  afterEach(function() {
    testHelpers.TestDom.clear();
    ServerConfig.override('enableDataLensAxisRescaling', false);
  });

  function createElement(pageData) {
    var scope = $rootScope.$new();

    _.extend(scope, {
      page: Mockumentary.createPage(pageData)
    });

    var html = '<axis-rescaling-toggle page="page"></axis-rescaling-toggle>';

    var element = testHelpers.TestDom.compileAndAppend(html, scope);

    return {
      scope: scope,
      element: element
    };
  }

  it('is hidden when enableAxisRescaling is hidden', function() {
    ServerConfig.override('enableDataLensAxisRescaling', 'hidden');
    var context = createElement();
    assert.isTrue($(context.element.find('.axis-rescaling-toggle')).hasClass('ng-hide'));
  });

  it('is visible and unchecked when enableAxisRescaling is false', function() {
    ServerConfig.override('enableDataLensAxisRescaling', false);
    var context = createElement();
    assert.isFalse($(context.element.find('.axis-rescaling-toggle')).hasClass('ng-hide'));
    expect(context.element.find('input:checked')).to.have.length(0);
  });

  it('is visible and checked when enableAxisRescaling is true', function() {
    ServerConfig.override('enableDataLensAxisRescaling', true);
    var context = createElement();
    assert.isFalse($(context.element.find('.axis-rescaling-toggle')).hasClass('ng-hide'));
    expect(context.element.find('input:checked')).to.have.length(1);
  });
});
