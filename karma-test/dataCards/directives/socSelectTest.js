(function() {
  'use strict';

  describe('<soc-select/>', function() {
    var testHelpers;
    var $rootScope;

    beforeEach(function() {
      module('dataCards');
      module('dataCards.directives');
      module('/angular_templates/dataCards/socSelect.html');
      module('dataCards/cards.sass');

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

    if (Modernizr.pointerevents) {
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
    } else {
      it('should overlay the select over the custom arrow if pointer events unsupported', function() {
        var scope = $rootScope.$new();
        var element = testHelpers.TestDom.compileAndAppend('<soc-select></soc-select>', scope);
        var arrow = element.children('.arrow-container');
        var arrowPosition = arrow.offset();
        var topElement = document.elementFromPoint(arrowPosition.left + 2, arrowPosition.top + 2);
        expect(topElement).to.equal(element.children('select')[0]);
      });
    }

    it('should pass the model through', function() {
      var scope = $rootScope.$new();
      var fakeModel = new Object();
      scope.m = fakeModel;
      var element = testHelpers.TestDom.compileAndAppend(
        '<soc-select ng-model="m"></soc-select>', scope
      );
      expect(element.find('select').scope().ngModel).to.equal(fakeModel);
    });

    it('should convert soc-options to options, and retain attributes', function() {
      var scope = $rootScope.$new();
      var element = testHelpers.TestDom.compileAndAppend(
        '<soc-select name="alpha">' +
        '<soc-option value="a">Ay</soc-option>' +
        '<soc-option value="b" disabled>Bee</soc-option>' +
        '</soc-select>', scope
      );
      var select = element.find('select[name="alpha"]');
      expect(select.length).to.equal(1);
      expect(select.find('option[value="a"]:contains("Ay")').length).to.equal(1);
      expect(select.find('option[value="b"]:disabled:contains("Bee")').length).to.equal(1);
    });
  });
})();
