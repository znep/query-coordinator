(function() {
  'use strict';

  describe('<clearable-input/>', function() {
    var $document;
    var $window;
    var testHelpers;
    var $rootScope;
    var TEST_ID = 'my-test-id';
    var TEST_PLACEHOLDER = 'My Test Placeholder';
    var TEST_VALUE = 'My test value';

    /**
     * Create the <api-explorer> element with the proper wiring and add it to the dom.
     */
    function addValidElement() {
      var scope = $rootScope.$new();
      var element = testHelpers.TestDom.compileAndAppend(
        '<clearable-input input-id="{0}" placeholder="{1}" search="search"></clearable-input>'.format(TEST_ID, TEST_PLACEHOLDER),
        scope);
      $rootScope.$digest();
      return element;
    }

    beforeEach(function() {
      module('/angular_templates/dataCards/clearableInput.html');
      module('dataCards/clearable-input.sass');
      module('dataCards.directives');
      module('dataCards');
      module('test');

      inject(['$document', '$rootScope', '$window', 'testHelpers', function(_$document, _$rootScope, _$window, _testHelpers) {
        $document = _$document;
        $rootScope = _$rootScope;
        $window = _$window;
        testHelpers = _testHelpers;
      }]);
    });

    afterEach(function() {
      testHelpers.TestDom.clear();
    });

    describe('input element', function() {
      var element;
      var inputElement;
      beforeEach(function() {
        element = addValidElement();
        inputElement = element.find('input');
      });

      it('should exist', function() {
        expect(inputElement.length).to.equal(1);
      });

      it('should have placeholder attribute set', function() {
        expect(inputElement.attr('placeholder')).to.equal(TEST_PLACEHOLDER);
      });

      it('should have its id attribute set', function() {
        expect(inputElement.attr('id')).to.equal(TEST_ID);
      });

      describe('with input', function() {
        var input;
        beforeEach(function() {
          input = element.find('input').val(TEST_VALUE).trigger('change');
          input.scope().$apply();
        });
        it('should make the whole element "clearable"', function() {
          expect(element.find('.clearable-input-wrapper').hasClass('clearable')).to.be.true;
        });

        it('should set the "search" scope property', function() {
          expect(element.scope().search).to.equal(TEST_VALUE);
        });

        it('should clear the focused input on "esc"', function(done) {
          testHelpers.fireEvent(input[0], 'focus');
          testHelpers.fireEvent($document[0], 'keydown', { which: 27 });
          input.scope().$apply();
          testHelpers.waitForSatisfy(function() {
            return input.val() === '';
          }).then(done);
        });

        it('should not clear the unfocused input on "esc"', function() {
          testHelpers.fireEvent(input[0], 'blur');
          testHelpers.fireEvent($document[0], 'keydown', { which: 27 });
          input.scope().$apply();
          expect(input.val()).to.equal(TEST_VALUE);
        });
      })

    });

    describe('clear button', function() {
      var element;
      var button;
      var input;
      beforeEach(function() {
        element = addValidElement();
        button = element.find('button');
        input = element.find('input');
      });

      it('should be hidden initially', function() {
        var button = element.find('button');
        expect(button.is(':visible')).to.be.false;
      });

      describe('with input', function() {
        beforeEach(function() {
          input.val(TEST_VALUE).trigger('change');
          input.scope().$apply();
        });

        it('should be visible', function() {
          expect(button.is(':visible')).to.be.true;
        });

        it('should clear the input on click', function(done) {
          button.click();
          input.scope().$apply();
          testHelpers.waitForSatisfy(function() {
            return input.val() === '';
          }).then(done);
        })

      });

    });

    describe('custom events', function() {
      var element;
      var button;
      var input;
      beforeEach(function() {
        element = addValidElement();
        button = element.find('button');
        input = element.find('input');
      });

      it('should emit custom event for keypress events', function(done) {
        $rootScope.$on('clearableInput:keypress', function() {
          done();
        });
        input.trigger('keypress');
      });

      it('should emit custom event for click events', function(done) {
        $rootScope.$on('clearableInput:click', function() {
          done();
        });
        input.trigger('click');
      });

      it('should emit custom event for blur events', function(done) {
        element.focus();
        $rootScope.$on('clearableInput:blur', function() {
          done();
        });
        input.trigger('blur');
      });

    });

    it('should not be "clearable" initially', function() {
      var element = addValidElement();
      expect(element.find('.clearable-input-wrapper').hasClass('clearable')).to.be.false;
    });

  });

})();
