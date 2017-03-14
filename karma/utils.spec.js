var _ = require('lodash');
var $ = jQuery = require('jquery');
var utils = require('../src/utils');

describe('utils.js', function() {

  'use strict';

  describe('String.prototype.format', function() {

    describe('when the first argument is not an object', function() {

      it('correctly inteprolates values by index', function() {
        assert.equal(
          '{0}, {1}, {2}, {3}, {4}'.format(1, '2', 3, 4, 'five'),
          '1, 2, 3, 4, five'
        );
      });
    });

    describe('when the first argument is an object', function() {

      it('correctly interpolates values by name', function() {

        assert.equal(
          'test {first} test'.format({ first: 'TEST' }),
          'test TEST test'
        );
        assert.equal(
          '{0} TEST {third} {second}'.format({ '0': 'one', second: 'two', third: 'three' }),
          'one TEST three two'
        );
      });
    });
  });

  describe('String.prototype.escapeSpaces', function() {

    it('escapes spaces', function() {

      var stringWithSpaces = 'Hello,\u0020world!';

      assert.lengthOf(
        stringWithSpaces.escapeSpaces().match(/\u00A0/),
        1
      );
    });

    it('escapes non-breaking spaces', function() {

      var stringWithSpaces = 'Hello,\u00A0world!';

      assert.lengthOf(
        stringWithSpaces.escapeSpaces().match(/\u00A0/),
        1
      );
    });

    it('escapes zero-width non-breaking spaces', function() {

      var stringWithSpaces = 'Hello,\uFEFFworld!';

      assert.lengthOf(
        stringWithSpaces.escapeSpaces().match(/\u00A0/),
        1
      );
    });

    it('escapes tabs', function() {

      var stringWithSpaces = 'Hello,\u0009world!';

      assert.lengthOf(
        stringWithSpaces.escapeSpaces().match(/\u00A0/),
        1
      );
    });
  });

  describe('CustomEvent', function() {

    var listener;
    var handler;

    beforeEach(function() {

      listener = document.createElement('div');
      listener.id = 'listener';

      document.body.appendChild(listener);
    });

    afterEach(function() {

      listener.removeEventListener('test-event', handler);

      document.body.removeChild(listener);
    });

    describe('when called without explicit params', function() {

      it('emits an event with the default properties', function(done) {

        handler = function(e) {
          assert.isFalse(e.bubbles, 'bubbles is false');
          assert.isFalse(e.cancelable, 'cancelable is false');
          assert.isUndefined(e.detail, 'detail is undefined');
          done();
        };

        listener.addEventListener('test-event', handler);

        var customEvent = new CustomEvent('test-event');

        listener.dispatchEvent(customEvent);
      });
    });

    describe('when called with explicit params', function() {

      it('emits an event with the specified properties', function(done) {

        handler = function(e) {
          assert.isTrue(e.bubbles, 'bubbles is true');
          assert.isTrue(e.cancelable, 'cancelable is true');
          assert(e.detail === 'test', 'detail is "test"');
          done();
        };

        listener.addEventListener('test-event', handler);

        var params = {
          bubbles: true,
          cancelable: true,
          detail: 'test'
        };

        var customEvent = new CustomEvent('test-event', params);

        listener.dispatchEvent(customEvent);
      });
    });
  });

  describe('assertEqual', function() {

    describe('given two unequal values', function() {

      it('throws an error', function() {

        assert.throw(function() {
          utils.assertEqual(1, 2);
        });
      });
    });

    describe('given two equal values', function() {

      it('does not throw an error', function() {

        utils.assertEqual('equal', 'equal');
      });
    });
  });

  describe('assertHasProperty', function() {

    var testObject;

    beforeEach(function() {
      testObject = {
        propA: null,
        propB: 5,
        propC: 'asd'
      };
    });

    describe('given an object with the desired property', function() {

      it('does not throw', function() {
        utils.assertHasProperty(testObject, 'propA');
      });
    });

    describe('given an object without the desired property', function() {

      it('throws', function() {
        assert.throw(function() {
          utils.assertHasProperty(testObject, 'oops');
        });
      });
    });
  });

  describe('assertHasProperties', function() {

    var testObject;

    beforeEach(function() {
      testObject = {
        propA: null,
        propB: 5,
        propC: 'asd'
      };
    });

    describe('given an object with all the desired properties', function() {

      it('does not throw', function() {
        utils.assertHasProperties(testObject, 'propA', 'propB');
      });
    });

    describe('given an object without the desired property', function() {

      it('throws', function() {
        assert.throw(function() {
          utils.assertHasProperties(testObject, 'propA', 'propOops');
        });
      });
    });
  });

  describe('assertIsOneOfTypes', function() {

    describe('given a value of type not in the specified array', function() {

      assert.throw(function() {
        utils.assertIsOneOfTypes(1, 'boolean', 'string');
      });

      assert.throw(function() {
        utils.assertIsOneOfTypes(1, 'string', 'boolean');
      });

      assert.throw(function() {
        utils.assertIsOneOfTypes('1', 'number', 'object');
      });

      assert.throw(function() {
        utils.assertIsOneOfTypes(1, 'object', 'function');
      });

      assert.throw(function() {
        utils.assertIsOneOfTypes(1, 'function', 'boolean');
      });
    });

    describe('given a value of the specified type', function() {

      it('does not throw an error', function() {

        utils.assertIsOneOfTypes(true, 'boolean');
        utils.assertIsOneOfTypes('string', 'string');
        utils.assertIsOneOfTypes(1, 'function', 'number');
        utils.assertIsOneOfTypes({}, 'number', 'object');
        utils.assertIsOneOfTypes(function() {}, 'boolean', 'object', 'function');
      });
    });
  });

  describe('assertLengthIs', function() {

    describe('given a value without a length property', function() {

      it('throws', function() {
        assert.throw(function() {
          utils.assertLengthIs(1, 10);
        });
        assert.throw(function() {
          utils.assertLengthIs({}, 10);
        });
        assert.throw(function() {
          utils.assertLengthIs(null, 10);
        });
        assert.throw(function() {
          utils.assertLengthIs(undefined, 10);
        });
        assert.throw(function() {
          utils.assertLengthIs(/asd/, 10);
        });
      });
    });

    describe('given a non-number expected length', function() {
      it('throws', function() {
        assert.throw(function() {
          utils.assertLengthIs([]);
        });
        assert.throw(function() {
          utils.assertLengthIs([], '');
        });
        assert.throw(function() {
          utils.assertLengthIs([], {});
        });
        assert.throw(function() {
          utils.assertLengthIs([], []);
        });
        assert.throw(function() {
          utils.assertLengthIs([], null);
        });
        assert.throw(function() {
          utils.assertLengthIs([], undefined);
        });
        assert.throw(function() {
          utils.assertLengthIs([], /asd/);
        });
      });
    });

    describe('given a mismatch in length', function() {
      it('throws', function() {
        assert.throw(function() {
          utils.assertLengthIs([], 1);
        });
        assert.throw(function() {
          utils.assertLengthIs([ 'a' ], 0);
        });
        assert.throw(function() {
          utils.assertLengthIs([ 'a', 'b' ], 3);
        });
        assert.throw(function() {
          utils.assertLengthIs('', 1);
        });
        assert.throw(function() {
          utils.assertLengthIs('a', 0);
        });
        assert.throw(function() {
          utils.assertLengthIs('ab', 3);
        });
      });
    });

    describe('given a matching length', function() {
      it('does not throw', function() {
        utils.assertLengthIs([], 0);
        utils.assertLengthIs([ 'a' ], 1);
        utils.assertLengthIs([ 'a', 'b' ], 2);
        utils.assertLengthIs('', 0);
        utils.assertLengthIs('a', 1);
        utils.assertLengthIs('ab', 2);
      });
    });
  });

  describe('valueIsBlank', function() {

    describe('when the input is undefined', function() {

      it('returns true', function() {

        assert.isTrue(utils.valueIsBlank(undefined));
      });
    });

    describe('when the input is null', function() {

      it('returns true', function() {

        assert.isTrue(utils.valueIsBlank(null));
      });
    });

    describe('when the input is an empty string', function() {

      it('returns true', function() {

        assert.isTrue(utils.valueIsBlank(''));
      });
    });

    describe('when the input is false', function() {

      it('should return false', function() {

        assert.isFalse(utils.valueIsBlank(false));
      });
    });

    describe('when the input is an empty array', function() {

      it('should return false', function() {

        assert.isFalse(utils.valueIsBlank([]));
      });
    });

    describe('when the input is a non-empty string', function() {

      it('should return false', function() {

        assert.isFalse(utils.valueIsBlank('Hello, world!'));
      });
    });

    describe('when the input is a string with only whitespace', function() {

      it('should return false', function() {

        assert.isFalse(utils.valueIsBlank('   '));
      });
    });
  });

  describe('formatNumber', function() {

    var VALID_FORMATTED_NUMBER = /^-?(\d\,\d{3}|((\d(\.\d{1,2})?|\d{2}(\.\d)?|\d{3})[A-Z])|\d(\.\d{1,3})?|\d{2}(\.\d{1,2})?|\d{3}(\.\d)?)$/;

    function testValue(input, output, options) {

      var result = utils.formatNumber(input, options);
      var negativeResult = utils.formatNumber(-input, options);

      assert.equal(
        result,
        output
      );
      assert.match(result, VALID_FORMATTED_NUMBER);
      assert.equal(
        negativeResult,
        '-' + output
      );
      assert.match(negativeResult, VALID_FORMATTED_NUMBER);
    }

    describe('with the default options', function() {

      it('should leave zero alone', function() {

        assert.equal(
          utils.formatNumber(0),
          '0'
        );
      });

      it('should not change numbers between -999 and 999', function() {

        testValue(999, '999');
        testValue(600, '600');
        testValue(99, '99');
        testValue(50, '50');
        testValue(49, '49');
        testValue(9, '9');
      });

      it('should preserve decimals if they do not exceed a length of 4', function() {

        testValue(.001, '0.001');
        testValue(0.05, '0.05');
        testValue(10.8, '10.8');
        testValue(100.2, '100.2');
        testValue(999.1, '999.1');
        testValue(1000.5, '1,001');
      });

      it('should not return zero for very small decimals', function() {

        assert.equal(
          utils.formatNumber(.0012),
          '0.001'
        );
        assert.equal(
          utils.formatNumber(.0002),
          '0.0002'
        );
        assert.equal(
          utils.formatNumber(.0005),
          '0.0005'
        );
        assert.equal(
          utils.formatNumber(.0004999),
          '0.0004999'
        );
      });

      it('should commaify numbers with absolute value between 1000 and 9999', function() {

        testValue(1000, '1,000');
        testValue(5000, '5,000');
        testValue(9999.4999, '9,999');
        testValue(9999.9999, '10K');
      });

      it('should abbreviate other numbers in the thousands', function() {

        testValue(9999.5, '10K');
        testValue(10000, '10K');
        testValue(10001, '10K');
        testValue(10500, '10.5K');
        testValue(10501, '10.5K');
        testValue(10551, '10.6K');
        testValue(99499, '99.5K');
        testValue(99500, '99.5K');
        testValue(100100, '100K');
        testValue(999999, '1M');
      });

      it('should abbreviate numbers in the millions', function() {

        testValue(1000000, '1M');
        testValue(10000000, '10M');
        testValue(100000000, '100M');
      });

      it('should abbreviate numbers in the billions', function() {

        testValue(1000000000, '1B');
        testValue(1000005678, '1B');
        testValue(1012345678, '1.01B');
      });

      it('should abbreviate numbers that are really big', function() {

        testValue(1000000000000, '1T');
        testValue(1000000000000000, '1P');
        testValue(1000000000000000000, '1E');
        testValue(1000000000000000000000, '1Z');
        testValue(1000000000000000000000000, '1Y');
        testValue(9999999999999999999999999, '10Y');
        testValue(99999999999999999999999999, '100Y');
        testValue(100000000000000000000000000, '100Y');

        assert.equal(
          utils.formatNumber(1000000000000000000000000000),
          '1e+27'
        );
      });
    });

    it('with the group separator option', function() {

      assert.equal(
        utils.formatNumber(12.34, { groupCharacter: '|' }),
        '12.34'
      );
      assert.equal(
        utils.formatNumber(1234, { groupCharacter: '|' }),
        '1|234'
      );
    });

    it('with the decimal separator option', function() {

      assert.equal(
        utils.formatNumber(12.34, { decimalCharacter: ',' }),
        '12,34'
      );
    });
  });

  describe('commaify', function() {

    it('should leave zero alone', function() {

      assert.equal(
        utils.commaify(0),
        '0'
      );
    });

    it('should preserve the negative sign', function() {

      assert.equal(
        utils.commaify(-1000),
        '-1,000'
      );
    });

    it('should convert integers correctly using the default separator', function() {

      assert.equal(
        utils.commaify(20000),
        '20,000'
      );
      assert.equal(
        utils.commaify(2000000),
        '2,000,000'
      );
    });

    it('should convert integers correctly using a custom separator', function() {

      assert.equal(
        utils.commaify(20000, { groupCharacter: '.' }),
        '20.000'
      );
      assert.equal(
        utils.commaify(2000000, { groupCharacter: '.' }),
        '2.000.000'
      );
    });

    it('should deal with decimals correctly using the default separator', function() {

      assert.equal(
        utils.commaify(20000.1234),
        '20,000.1234'
      );
      assert.equal(
        utils.commaify(20000.1234, { groupCharacter: ',' }),
        '20,000.1234'
      );
    });

    it('should convert decimals correctly using a custom separator', function() {

      assert.equal(
        utils.commaify(20000.1234, { groupCharacter: '.', decimalCharacter: ',' }),
        '20.000,1234'
      );
    });

    it('should convert string numbers correctly', function() {

      assert.equal(
        utils.commaify('20000.1234'),
        '20,000.1234'
      );
    });
  });

  describe('pluralize', function() {

    it('should trim whitespace', function() {
      assert.equal(
        utils.pluralize('foo '),
        'foos'
      );
    });

    it('should pluralize octopus', function() {
      assert.equal(
        utils.pluralize('octopus'),
        'octopi'
      );
    });

    it('should not pluralize money', function() {
      assert.equal(
        utils.pluralize('money'),
        'money'
      );
    });

    it('should not pluralize money if it has other words before it', function() {
      assert.equal(
        utils.pluralize('cash money'),
        'cash money'
      );
    });

    it('should not modify the string if the second parameter is 1', function() {
      assert.equal(
        utils.pluralize('cat'),
        'cats'
      );
      assert.equal(
        utils.pluralize('cat', 0),
        'cats'
      );
      assert.equal(
        utils.pluralize('cat', 1),
        'cat'
      );
      assert.equal(
        utils.pluralize('cat', 2),
        'cats'
      );
      assert.equal(
        utils.pluralize('cat', '1'),
        'cats'
      );
      assert.equal(
        utils.pluralize('cat', null),
        'cats'
      );
      assert.equal(
        utils.pluralize('cat', 'dog'),
        'cats'
      );
    });
  });

  describe('isolateScrolling', function() {
    // CSS specifications
    var heightOfScrollableContent = 50;
    var scrollingBox = {
      border: '1px solid #000',
      position: 'absolute',
      width: 20,
      height: 20,
      top: 0,
      left: 0,
      overflow: 'auto'
    };
    var contentBox =  {
      height: heightOfScrollableContent
    };
    var staticBox = {
      position: 'absolute',
      width: 20,
      height: 20,
      top: 100,
      left: 100
    };

    // Div elements
    var scrollingDiv;
    var staticDiv;
    var divContent;

    // Spy to determine whether default page scrolling was prevented
    var preventDefaultSpy;

    beforeEach(function() {
      // Build test HTML
      scrollingDiv = $('<div />', {
        className: 'scrolling-div',
        css: scrollingBox
      }).appendTo('body');

      divContent = $('<div />', {
        className: 'content',
        css: contentBox
      }).appendTo(scrollingDiv);

      staticDiv = $('<div />', {
        className: 'static-div',
        css: staticBox
      }).appendTo('body');
    });

    afterEach(function() {
      preventDefaultSpy.restore();
      divContent.remove();
      scrollingDiv.remove();
      staticDiv.remove();
    });

    // Construct a scroll event of the given name and direction (up or down)
    function buildTestEvent(eventName, scrollDirection) {
      var testDeltaY;
      switch(eventName) {
        case 'mousewheel':
          // scrolling up is positive, down is negative
          testDeltaY = (scrollDirection === 'up') ? 200 : -400;
          break;
        case 'DOMMouseScroll':
        case 'MozMousePixelScroll':
          // scrolling up is negative, down is positive
          testDeltaY = (scrollDirection === 'up') ? -200 : 400;
          break;
        default:
          throw new Error('Unexpected eventName passed to buildTestEvent: {0}'.format(eventName));
      }

      var propertyName = (eventName === 'mousewheel') ? 'wheelDelta' : 'detail';

      var originalEventData = { preventDefault: _.noop };
      originalEventData[propertyName] = testDeltaY;

      return jQuery.Event(eventName, {originalEvent: originalEventData});
    }

    describe('mousewheel (IE, Safari, Chrome)', function() {
      it('should prevent page scrolling if at top of current scrollable div', function() {
        var testEvent = buildTestEvent('mousewheel', 'up');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        utils.isolateScrolling(scrollingDiv, true);

        scrollingDiv.trigger(testEvent);
        sinon.assert.calledOnce(preventDefaultSpy);
      });

      it('should prevent page scrolling if at bottom of current scrollable div', function() {
        // set scrollbar to bottom of div
        scrollingDiv.scrollTop(heightOfScrollableContent);
        var testEvent = buildTestEvent('mousewheel', 'down');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        utils.isolateScrolling(scrollingDiv, true);

        scrollingDiv.trigger(testEvent);
        sinon.assert.calledOnce(preventDefaultSpy);
      });

      it('should not prevent page scrolling up if initiated outside of scrolling div', function() {
        var testEvent = buildTestEvent('mousewheel', 'up');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        utils.isolateScrolling(scrollingDiv, true);

        staticDiv.trigger(testEvent);
        sinon.assert.notCalled(preventDefaultSpy);
      });

      it('should not prevent page scrolling down if initiated outside of scrolling div', function() {
        var testEvent = buildTestEvent('mousewheel', 'down');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        utils.isolateScrolling(scrollingDiv, true);

        staticDiv.trigger(testEvent);
        sinon.assert.notCalled(preventDefaultSpy);
      });

      it('when isolateScrolling is called twice with enabled=true, and then again with enabled=false, page scrolling is no longer disabled', function() {
        // Enable isolateScrolling to scrollingDiv and disable page scrolling
        var testEvent = buildTestEvent('mousewheel', 'up');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        utils.isolateScrolling(scrollingDiv, true);
        utils.isolateScrolling(scrollingDiv, true); // intentional

        scrollingDiv.trigger(testEvent);
        sinon.assert.calledOnce(preventDefaultSpy);

        // Disable isolateScrolling to the scrollingDiv and renable page scrolling
        utils.isolateScrolling(scrollingDiv, false);

        var testEvent = buildTestEvent('mousewheel', 'up');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        scrollingDiv.trigger(testEvent);
        sinon.assert.notCalled(preventDefaultSpy);
      });
    });

    describe('DOMMouseScroll (some versions of Firefox)', function() {
      it('should prevent page scrolling if at top of current scrollable div', function() {
        var testEvent = buildTestEvent('DOMMouseScroll', 'up');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        utils.isolateScrolling(scrollingDiv, true);

        scrollingDiv.trigger(testEvent);
        sinon.assert.calledOnce(preventDefaultSpy);
      });

      it('should prevent page scrolling if at bottom of current scrollable div', function() {
        // set scrollbar to bottom of div
        scrollingDiv.scrollTop(heightOfScrollableContent);
        var testEvent = buildTestEvent('DOMMouseScroll', 'down');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        utils.isolateScrolling(scrollingDiv, true);

        scrollingDiv.trigger(testEvent);
        sinon.assert.calledOnce(preventDefaultSpy);
      });

      it('should not prevent page scrolling up if initiated outside of scrolling div', function() {
        var testEvent = buildTestEvent('DOMMouseScroll', 'up');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        utils.isolateScrolling(scrollingDiv, true);

        staticDiv.trigger(testEvent);
        sinon.assert.notCalled(preventDefaultSpy);
      });

      it('should allow page scrolling if not over scrollable div', function() {
        var testEvent = buildTestEvent('DOMMouseScroll', 'down');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        utils.isolateScrolling(scrollingDiv, true);

        staticDiv.trigger(testEvent);
        sinon.assert.notCalled(preventDefaultSpy);
      });

      it('when isolateScrolling is called with enabled=true, and then again with enabled=false, page scrolling is no longer disabled', function() {
        // Enable isolateScrolling to scrollingDiv and disable page scrolling
        var testEvent = buildTestEvent('DOMMouseScroll', 'up');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        utils.isolateScrolling(scrollingDiv, true);

        scrollingDiv.trigger(testEvent);
        sinon.assert.calledOnce(preventDefaultSpy);

        // Disable isolateScrolling to the scrollingDiv and renable page scrolling
        utils.isolateScrolling(scrollingDiv, false);

        var testEvent = buildTestEvent('DOMMouseScroll', 'up');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        scrollingDiv.trigger(testEvent);
        sinon.assert.notCalled(preventDefaultSpy);
      });
    });

    describe('MozMousePixelScroll (some versions of Firefox)', function() {
      it('should prevent page scrolling if at top of current scrollable div', function() {
        var testEvent = buildTestEvent('MozMousePixelScroll', 'up');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        utils.isolateScrolling(scrollingDiv, true);

        scrollingDiv.trigger(testEvent);
        sinon.assert.calledOnce(preventDefaultSpy);
      });

      it('should prevent page scrolling if at bottom of current scrollable div', function() {
        // set scrollbar to bottom of div
        scrollingDiv.scrollTop(heightOfScrollableContent);
        var testEvent = buildTestEvent('MozMousePixelScroll', 'down');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        utils.isolateScrolling(scrollingDiv, true);

        scrollingDiv.trigger(testEvent);
        sinon.assert.calledOnce(preventDefaultSpy);
      });

      it('should not prevent page scrolling up if initiated outside of scrolling div', function() {
        var testEvent = buildTestEvent('MozMousePixelScroll', 'up');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        utils.isolateScrolling(scrollingDiv, true);

        staticDiv.trigger(testEvent);
        sinon.assert.notCalled(preventDefaultSpy);
      });

      it('should allow page scrolling if not over scrollable div', function() {
        var testEvent = buildTestEvent('MozMousePixelScroll', 'down');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        utils.isolateScrolling(scrollingDiv, true);

        staticDiv.trigger(testEvent);
        sinon.assert.notCalled(preventDefaultSpy);
      });

      it('when isolateScrolling is called with enabled=true, and then again with enabled=false, page scrolling is no longer disabled', function() {
        // Enable isolateScrolling to scrollingDiv and disable page scrolling
        var testEvent = buildTestEvent('MozMousePixelScroll', 'up');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        utils.isolateScrolling(scrollingDiv, true);

        scrollingDiv.trigger(testEvent);
        sinon.assert.calledOnce(preventDefaultSpy);

        // Disable isolateScrolling to the scrollingDiv and renable page scrolling
        utils.isolateScrolling(scrollingDiv, false);

        var testEvent = buildTestEvent('MozMousePixelScroll', 'up');
        preventDefaultSpy = sinon.spy(testEvent, 'preventDefault');

        scrollingDiv.trigger(testEvent);
        sinon.assert.notCalled(preventDefaultSpy);
      });
    });
  });

  describe('getCookie', function() {

    beforeEach(function() {
      document.cookie = 'cookie-type=chocolate-chip;';
      document.cookie = 'another-cookie=oatmeal raisin;';
    });

    describe('when passed a cookie name that does not exist', function() {

      it('returns undefined', function() {
        assert.isUndefined(utils.getCookie('pie'));
      });

    });

    describe('when passed a cookie name that has one value', function() {

      it('returns one value', function() {
        assert.equal('chocolate-chip', utils.getCookie('cookie-type'));
        assert.equal('oatmeal raisin', utils.getCookie('another-cookie'));
      });

    });
  });

  describe('assertInstanceOf', function() {
    var SomeClass = function() {};
    var SomeOtherClass = function() {};

    describe('given zero or one arguments', function() {
      it('should throw', function() {
        assert.throws(function() { utils.assertInstanceOf(); });
        assert.throws(function() { utils.assertInstanceOf({}); });
      });
    });

    describe('given an object that is not an instance of the given instantiator', function() {
      it('should throw', function() {
        assert.throws(function() { utils.assertInstanceOf(4, SomeClass); });
        assert.throws(function() { utils.assertInstanceOf('', SomeClass); });
        assert.throws(function() { utils.assertInstanceOf([], SomeClass); });
        assert.throws(function() { utils.assertInstanceOf({}, SomeClass); });
        assert.throws(function() { utils.assertInstanceOf(new SomeClass(), SomeOtherClass); });
      });
    });

    describe('given an object that is an instance of the instantiator', function() {
      it('should not throw', function() {
        utils.assertInstanceOf(new SomeClass(), SomeClass);
      });
    });

    describe('given an Array that is an instance of the instantiator', function() {
      it('should not throw', function() {
        utils.assertInstanceOf([], Array);
      });
    });
  });

  describe('assertInstanceOfAny', function() {
    var SomeClass = function() {};
    var SomeOtherClass = function() {};

    describe('given zero or one arguments', function() {
      it('should throw', function() {
        assert.throws(function() { utils.assertInstanceOfAny(); });
        assert.throws(function() { utils.assertInstanceOfAny({}); });
      });
    });

    describe('given an object that is not an instance of the given instantiators', function() {
      it('should throw', function() {
        assert.throws(function() { utils.assertInstanceOfAny(4, SomeClass); });
        assert.throws(function() { utils.assertInstanceOfAny('', SomeClass); });
        assert.throws(function() { utils.assertInstanceOfAny([], SomeClass); });
        assert.throws(function() { utils.assertInstanceOfAny({}, SomeClass); });
        assert.throws(function() { utils.assertInstanceOfAny(new SomeClass(), SomeOtherClass); });
      });
    });

    describe('given an object that is an instance of at least one of the given instantiators', function() {
      it('should not throw', function() {
        utils.assertInstanceOfAny(new SomeClass(), SomeClass);
        utils.assertInstanceOfAny(new SomeClass(), SomeClass, SomeOtherClass);
        utils.assertInstanceOfAny(new SomeClass(), SomeOtherClass, SomeClass);
      });
    });

    describe('given an Array that is an instance of at least one of the given instantiators', function() {
      it('should not throw', function() {
        utils.assertInstanceOfAny([], Array);
        utils.assertInstanceOfAny([], Array, SomeClass);
        utils.assertInstanceOfAny([], Array, SomeOtherClass);
      });
    });
  });
});
