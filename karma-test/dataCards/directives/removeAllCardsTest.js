describe('<remove-all-cards> directive', function() {
  'use strict';

  var testHelpers;
  var $rootScope;

  beforeEach(module('/angular_templates/dataCards/removeAllCards.html'));
  beforeEach(module('dataCards.directives'));
  beforeEach(module('dataCards.services'));
  beforeEach(module('dataCards.filters'));
  beforeEach(module('test'));

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
      expect(button).to.have.class('disabled');
      button.click();
      expect(panel).to.not.have.class('active');
    });

    it('should be enabled if the scope says so', function() {
      var context = createElement({ enabled: true });
      var button = context.element.find('.remove-all-cards-button');
      var panel = context.element.find('.tool-panel-main');
      expect(button).to.not.have.class('disabled');
      button.click();
      expect(panel).to.have.class('active');
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
      expect(panel).to.have.class('active');

      context.element.find('[data-action="cancel"]').click();

      expect(panel).to.not.have.class('active');
      expect(didSignal).to.be.false;

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
      expect(panel).to.have.class('active');

      context.element.find('[data-action="removeAll"]').click();

      expect(panel).to.not.have.class('active');
      expect(didSignal).to.be.true;
    });
  });
});
