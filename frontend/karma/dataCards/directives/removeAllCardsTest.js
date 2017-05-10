import { expect, assert } from 'chai';
const angular = require('angular');

describe('removeAllCards', function() {
  'use strict';

  var testHelpers;
  var $rootScope;

  beforeEach(angular.mock.module('test'));
  beforeEach(angular.mock.module('dataCards'));

  beforeEach(function() {
    inject([
      'testHelpers',
      '$rootScope',
      function(_testHelpers, _$rootScope) {
        testHelpers = _testHelpers;
        $rootScope = _$rootScope;
    }]);
  });

  function createElement(scopeOverrides) {
    var scope = $rootScope.$new();

    _.extend(
      scope,
      {
        enabled: false
      },
      (scopeOverrides || {})
    );

    var html = [
      '<remove-all-cards enabled="enabled"></remove-all-cards>'
    ].join('');

    var element = testHelpers.TestDom.compileAndAppend(html, scope);

    scope.$digest();

    return {
      scope: scope,
      element: element
    };
  }

  describe('toolbar button', function() {
    it('should be disabled if the scope says so', function() {
      var context = createElement({ enabled: false });
      var button = context.element.find('.remove-all-cards-button');
      var panel = context.element.find('.tool-panel-main');
      assert.isTrue($(button).hasClass('disabled'));
      button.click();
      assert.isFalse($(panel).hasClass('active'));
    });

    it('should be enabled if the scope says so', function() {
      var context = createElement({ enabled: true });
      var button = context.element.find('.remove-all-cards-button');
      var panel = context.element.find('.tool-panel-main');
      assert.isFalse($(button).hasClass('disabled'));
      button.click();
      assert.isTrue($(panel).hasClass('active'));
    });
  });

  describe('confirmation flyout', function() {
    it('should hide the flyout and do nothing else if the user cancels', function() {
      var context = createElement({ enabled: true });
      var button = context.element.find('.remove-all-cards-button');
      var panel = context.element.find('.tool-panel-main');
      var didSignal = false;
      context.scope.$on('delete-all-cards', function() {
        didSignal = true;
      });

      button.click();
      assert.isTrue($(panel).hasClass('active'));

      context.element.find('[data-action="cancel"]').click();

      assert.isFalse($(panel).hasClass('active'));
      assert.isFalse(didSignal);

    });

    it('should hide the flyout and signal to remove all non-table cards if the user accepts', function() {
      var context = createElement({ enabled: true });
      var button = context.element.find('.remove-all-cards-button');
      var panel = context.element.find('.tool-panel-main');
      var didSignal = false;
      context.scope.$on('delete-all-cards', function() {
        didSignal = true;
      });

      button.click();
      assert.isTrue($(panel).hasClass('active'));

      context.element.find('[data-action="removeAll"]').click();

      assert.isFalse($(panel).hasClass('active'));
      assert.isTrue(didSignal);
    });
  });
});
