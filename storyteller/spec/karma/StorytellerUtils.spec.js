import $ from 'jquery';
import sinon from 'sinon';
import { assert } from 'chai';

import { $transient } from './TransientElement';
import StorytellerUtils from '../../app/assets/javascripts/StorytellerUtils';

describe('StorytellerUtils', function() {
  describe('.inspectNode()', function() {

    it('should return expected values', function() {
      function test(expected, element) {
        assert.equal(expected, StorytellerUtils.inspectNode(element));
      }

      test('<not a dom node>', null);
      test('<not a dom node>', undefined);
      test('<not a dom node>', $([]));
      test('<div />', $('<div>'));
      test('<span />', document.createElement('span'));
      test('<div class="foo" />', $('<div>', { 'class': 'foo' }));
      test('<div id="bar" class="foo" />', $('<div>', { 'class': 'foo', 'id': 'bar' }));

      var withChildren = $('<div class="foo"><p><span>');
      var leaf = withChildren.find('span');
      test('<span /> parents: <p /> <div class="foo" />', leaf);
    });
  });

  describe('.typeToClassNameForComponentType()', function() {

    it('should throw when provided a value that is not a string', function() {
      assert.throws(function() {
        StorytellerUtils.typeToClassNameForComponentType({});
      });
    });

    it('should return a "component-", hyphenated word string when provided a valid string', function() {
      assert.equal(
        StorytellerUtils.typeToClassNameForComponentType('helloWorld'),
        'component-hello-world'
      );
    });
  });

  describe('queryParameterMatches', function() {
    const paramName = 'bob';

    let originalQueryParameters;
    before(function() {
      originalQueryParameters = StorytellerUtils.queryParameters;
      StorytellerUtils.queryParameters = _.constant([[paramName, 'false']]);
    });
    after(function() {
      StorytellerUtils.queryParameters = originalQueryParameters;
    });

    function expectTrue(conditionDescription, key, value) {
      it('should return true', function() {
        assert.isTrue(StorytellerUtils.queryParameterMatches(key, value));
      });
    }

    function expectFalse(conditionDescription, key, value) {
      it('should return false', function() {
        assert.isFalse(StorytellerUtils.queryParameterMatches(key, value));
      });
    }

    describe('given a parameter value to match', function() {
      expectTrue('when a matching key/value pair exists', 'bob', false);
      expectFalse('when a matching value does not exist', 'bob', true);
      expectFalse('when a matching key does not exist', 'frank', false);
    });

    describe('without a parameter value to match', function() {
      expectTrue('when a matching key exists', 'bob');
      expectFalse('when a matching key does not exist', 'frank');
    });
  });

  describe('event binding functions', function() {
    var spy;
    beforeEach(function() {
      spy = sinon.spy();
      $transient.append('<input class="child-1">');
      $transient.append('<input class="child-2">');
    });

    describe('bindEvents', function() {
      it('should bind a handler for a non-delegated event', function() {
        var events = {
          'custom-event': [
            [spy]
          ]
        };

        StorytellerUtils.bindEvents($transient, events);
        $transient.trigger('custom-event');

        sinon.assert.calledOnce(spy);
      });

      it('should bind a handler for a delegated event', function() {
        var events = {
          'custom-event': [
            ['.child-1', spy]
          ]
        };

        StorytellerUtils.bindEvents($transient, events);
        $transient.find('.child-1').trigger('custom-event');

        sinon.assert.calledOnce(spy);
      });

      it('should bind multiple handlers for multiple events', function() {
        var events = {
          'custom-event': [
            ['.child-1', spy],
            ['.child-2', spy]
          ],
          'other-custom-event': [
            [spy]
          ]
        };

        StorytellerUtils.bindEvents($transient, events);
        $transient.find('.child-1').trigger('custom-event');
        $transient.find('.child-2').trigger('custom-event');
        $transient.trigger('other-custom-event');

        sinon.assert.calledThrice(spy);
      });
    });

    describe('unbindEvents', function() {
      beforeEach(function() {
        var events = {
          'custom-event': [
            ['.child-1', spy],
            ['.child-2', spy]
          ],
          'other-custom-event': [
            [spy]
          ]
        };

        StorytellerUtils.bindEvents($transient, events);
      });

      it('should unbind a handler for a non-delegated event', function() {
        var events = {
          'other-custom-event': [
            [spy]
          ]
        };

        StorytellerUtils.unbindEvents($transient, events);
        $transient.trigger('other-custom-event');

        sinon.assert.notCalled(spy);
      });

      it('should unbind a handler for a delegated event', function() {
        var events = {
          'custom-event': [
            ['.child-1', spy]
          ]
        };

        StorytellerUtils.unbindEvents($transient, events);
        $transient.find('.child-1').trigger('custom-event');

        sinon.assert.notCalled(spy);

        // doesn't unbind all delegated handlers for the events
        $transient.find('.child-2').trigger('custom-event');

        sinon.assert.calledOnce(spy);
      });

      it('should unbind multiple handlers for multiple events', function() {
        var events = {
          'custom-event': [
            ['.child-1', spy],
            ['.child-2', spy]
          ],
          'other-custom-event': [
            [spy]
          ]
        };

        StorytellerUtils.unbindEvents($transient, events);
        $transient.find('.child-1').trigger('custom-event');
        $transient.find('.child-2').trigger('custom-event');
        $transient.trigger('other-custom-event');

        sinon.assert.notCalled(spy);
      });
    });
  });

  describe('DOM traversal functions', function() {

    var validElement;
    var validChild1;
    var validChild2;
    var validChild3;
    var validChild4;
    var validChild5;

    beforeEach(function() {

      validElement = document.createDocumentFragment();
      validChild1 = document.createElement('div');
      validChild2 = document.createElement('ul');
      validChild3 = document.createElement('li');
      validChild4 = document.createElement('p');
      validChild5 = document.createTextNode('Hello, world!');

      validChild4.appendChild(validChild5);
      validChild3.appendChild(validChild4);
      validChild2.appendChild(validChild3);
      validChild1.appendChild(validChild2);
      validElement.appendChild(validChild1);
    });

    describe('mapDOMFragmentDescending()', function() {

      var validApplyFn = function(el) { return el; };
      var validShouldTerminateFn = function() { return false; };
      var convertNonDivsToDivs = function(el) {
        if (el.nodeName.toLowerCase() === 'div') {
          return el;
        } else if (el.nodeType === 1) {
          var newNode = document.createElement('div');
          return newNode;
        } else {
          return el;
        }
      };

      describe('when called with an initial element that is not a DOM node', function() {

        it('throws an error', function() {

          assert.throw(function() {
            StorytellerUtils.mapDOMFragmentDescending(
              null,
              validApplyFn,
              validShouldTerminateFn
            );
          });
        });
      });

      describe('when called with an applyFn that is not a function', function() {

        it('throws an error', function() {

          assert.throw(function() {
            StorytellerUtils.mapDOMFragmentDescending(
              validElement,
              null,
              validShouldTerminateFn
            );
          });
        });
      });

      describe('when called with a shouldTerminateFn that is not a function', function() {

        it('throws an error', function() {

          assert.throw(function() {
            StorytellerUtils.mapDOMFragmentDescending(
              validElement,
              validApplyFn,
              null
            );
          });
        });
      });

      describe('when called with a pass-through applyFn', function() {

        it('should not change the fragment', function() {

          var newFragment = StorytellerUtils.mapDOMFragmentDescending(
            validElement,
            validApplyFn,
            validShouldTerminateFn
          );

          assert.deepEqual(newFragment, validElement);
        });
      });

      describe('when called with a applyFn that changes non-div elements to divs', function() {

        it('should convert non-div elements to div elements', function() {

          var newFragment = StorytellerUtils.mapDOMFragmentDescending(
            validElement,
            convertNonDivsToDivs,
            validShouldTerminateFn
          );

          assert.equal($(newFragment).find('div').length, 4);
          assert.equal($(newFragment).find('ul').length, 0);
          assert.equal($(newFragment).find('li').length, 0);
          assert.equal($(newFragment).find('p').length, 0);
        });
      });
    });

    describe('reduceDOMFragmentAscending()', function() {

      var validApplyFn = function(el, acc) { acc.push(el.nodeName.toLowerCase()); };
      var validShouldTerminateFn = function() { return false; };
      var validAccumulator = [];
      var collectElementNodes = function(el, acc) {
        if (el.nodeType === 1) {
          acc.push(el.nodeName.toLowerCase());
        }
      };
      var collectDivs = function(el, acc) {
        if (el.nodeName.toLowerCase() === 'div') {
          acc.push(el.nodeName.toLowerCase());
        }
      };

      describe('when called with an initial element that is not a DOM node', function() {

        it('throws an error', function() {

          assert.throw(function() {
            StorytellerUtils.reduceDOMFragmentAscending(
              null,
              validApplyFn,
              validShouldTerminateFn,
              validAccumulator
            );
          });
        });
      });

      describe('when called with an applyFn that is not a function', function() {

        it('throws an error', function() {

          assert.throw(function() {
            StorytellerUtils.reduceDOMFragmentAscending(
              validChild5,
              null,
              validShouldTerminateFn,
              validAccumulator
            );
          });
        });
      });

      describe('when called with a shouldTerminateFn that is not a function', function() {

        it('throws an error', function() {

          assert.throw(function() {
            StorytellerUtils.reduceDOMFragmentAscending(
              validChild5,
              validApplyFn,
              null,
              validAccumulator
            );
          });
        });
      });

      describe('when called with a shouldTerminateFn that is not a function', function() {

        it('throws an error', function() {

          assert.throw(function() {
            StorytellerUtils.reduceDOMFragmentAscending(
              validChild5,
              validApplyFn,
              validShouldTerminateFn,
              null
            );
          });
        });
      });

      describe('when called with a pass-through applyFn', function() {

        it('should accumulate all node names', function() {

          var accumulated = StorytellerUtils.reduceDOMFragmentAscending(
            validChild5,
            validApplyFn,
            validShouldTerminateFn,
            []
          );

          assert.deepEqual(accumulated, ['#document-fragment', 'div', 'ul', 'li', 'p', '#text']);
        });
      });

      describe('when called with a applyFn that only collects element node names', function() {

        it('should accumulate only element node names', function() {

          var accumulated = StorytellerUtils.reduceDOMFragmentAscending(
            validChild5,
            collectElementNodes,
            validShouldTerminateFn,
            []
          );

          assert.deepEqual(accumulated, ['div', 'ul', 'li', 'p']);
        });
      });

      describe('when called with a applyFn that only collects div node names', function() {

        it('should accumulate only div node names', function() {

          var accumulated = StorytellerUtils.reduceDOMFragmentAscending(
            validChild5,
            collectDivs,
            validShouldTerminateFn,
            []
          );

          assert.deepEqual(accumulated, ['div']);
        });
      });
    });

    describe('reduceDOMFragmentDescending()', function() {

      var validApplyFn = function(el, acc) { acc.push(el.nodeName.toLowerCase()); };
      var validShouldTerminateFn = function() { return false; };
      var validAccumulator = [];
      var collectElementNodes = function(el, acc) {
        if (el.nodeType === 1) {
          acc.push(el.nodeName.toLowerCase());
        }
      };
      var collectDivs = function(el, acc) {
        if (el.nodeName.toLowerCase() === 'div') {
          acc.push(el.nodeName.toLowerCase());
        }
      };

      describe('when called with an initial element that is not a DOM node', function() {

        it('throws an error', function() {

          assert.throw(function() {
            StorytellerUtils.reduceDOMFragmentDescending(
              null,
              validApplyFn,
              validShouldTerminateFn,
              validAccumulator
            );
          });
        });
      });

      describe('when called with an applyFn that is not a function', function() {

        it('throws an error', function() {

          assert.throw(function() {
            StorytellerUtils.reduceDOMFragmentDescending(
              validElement,
              null,
              validShouldTerminateFn,
              validAccumulator
            );
          });
        });
      });

      describe('when called with a shouldTerminateFn that is not a function', function() {

        it('throws an error', function() {

          assert.throw(function() {
            StorytellerUtils.reduceDOMFragmentDescending(
              validElement,
              validApplyFn,
              null,
              validAccumulator
            );
          });
        });
      });

      describe('when called with a shouldTerminateFn that is not a function', function() {

        it('throws an error', function() {

          assert.throw(function() {
            StorytellerUtils.reduceDOMFragmentDescending(
              validElement,
              validApplyFn,
              validShouldTerminateFn,
              null
            );
          });
        });
      });

      describe('when called with a pass-through applyFn', function() {

        it('should accumulate all node names', function() {

          var accumulated = StorytellerUtils.reduceDOMFragmentDescending(
            validElement,
            validApplyFn,
            validShouldTerminateFn,
            []
          );

          assert.deepEqual(accumulated, ['#document-fragment', 'div', 'ul', 'li', 'p', '#text']);
        });
      });

      describe('when called with a applyFn that only collects element node names', function() {

        it('should accumulate only element node names', function() {

          var accumulated = StorytellerUtils.reduceDOMFragmentDescending(
            validElement,
            collectElementNodes,
            validShouldTerminateFn,
            []
          );

          assert.deepEqual(accumulated, ['div', 'ul', 'li', 'p']);
        });
      });

      describe('when called with a applyFn that only collects div node names', function() {

        it('should accumulate only div node names', function() {

          var accumulated = StorytellerUtils.reduceDOMFragmentDescending(
            validElement,
            collectDivs,
            validShouldTerminateFn,
            []
          );

          assert.deepEqual(accumulated, ['div']);
        });
      });
    });
  });

  describe('.generateYoutubeUrl()', function() {

    describe('not given an id', function() {

      it('should throw an error', function() {

        assert.throw(function() {
          StorytellerUtils.generateYoutubeUrl();
        });
      });
    });

    describe('given an id', function() {

      it('should generate the expected url', function() {

        var youtubeId = 'ABCDEFGHIJK';
        var expectedUrl = 'https://www.youtube.com/embed/' + youtubeId;

        assert.equal(expectedUrl, StorytellerUtils.generateYoutubeUrl(youtubeId));
      });
    });
  });

  describe('.generateGoalEmbedEditSrc()', function() {

    describe('missing or invalid arguments', function() {

      it('should throw', function() {
        assert.throw(function() {
          StorytellerUtils.generateGoalEmbedEditSrc();
        });
        assert.throw(function() {
          StorytellerUtils.generateGoalEmbedEditSrc(null);
        });
        assert.throw(function() {
          StorytellerUtils.generateGoalEmbedEditSrc({});
        });
        assert.throw(function() {
          StorytellerUtils.generateGoalEmbedEditSrc(5);
        });
      });
    });

    describe('given valid arguments', function() {

      it('should return the correct url', function() {
        assert.equal(
          StorytellerUtils.generateGoalEmbedEditSrc('four-four'),
          '/stat/goals/single/four-four/embed/edit'
        );
      });
    });
  });

  describe('.generateGoalEmbedSrc()', function() {

    describe('missing or invalid arguments', function() {

      it('should throw', function() {
        assert.throw(function() {
          StorytellerUtils.generateGoalEmbedSrc();
        });
        assert.throw(function() {
          StorytellerUtils.generateGoalEmbedSrc(null);
        });
        assert.throw(function() {
          StorytellerUtils.generateGoalEmbedSrc({});
        });
        assert.throw(function() {
          StorytellerUtils.generateGoalEmbedSrc(5);
        });
      });
    });

    describe('given valid arguments', function() {

      it('should return the correct url', function() {
        assert.equal(
          StorytellerUtils.generateGoalEmbedSrc('four-four'),
          '/stat/goals/single/four-four/embed'
        );
      });
    });
  });

  describe('.generateYoutubeIframeSrc()', function() {

    describe('not given an id', function() {

      it('should throw an error', function() {

        assert.throw(function() {
          StorytellerUtils.generateYoutubeUrl();
        });
      });
    });

    describe('given an id', function() {

      describe('when the autoplay argument is undefined', function() {

        it('should generate the expected url', function() {

          var youtubeId = 'ABCDEFGHIJK';
          var expectedUrl = 'https://www.youtube.com/embed/' + youtubeId + '?rel=0&showinfo=0';

          assert.equal(expectedUrl, StorytellerUtils.generateYoutubeIframeSrc(youtubeId));
        });
      });

      describe('when the autoplay argument is false', function() {

        it('should generate the expected url', function() {

          var youtubeId = 'ABCDEFGHIJK';
          var expectedUrl = 'https://www.youtube.com/embed/' + youtubeId + '?rel=0&showinfo=0';

          assert.equal(expectedUrl, StorytellerUtils.generateYoutubeIframeSrc(youtubeId, false));
        });
      });

      describe('when the autoplay argument is true', function() {

        it('should generate the expected url', function() {

          var youtubeId = 'ABCDEFGHIJK';
          var expectedUrl = 'https://www.youtube.com/embed/' + youtubeId + '?rel=0&showinfo=0&autoplay=true';

          assert.equal(expectedUrl, StorytellerUtils.generateYoutubeIframeSrc(youtubeId, true));
        });
      });
    });
  });

  describe('.findClosestAttribute', function() {
    describe('when given invalid arguments', function() {
      it('should throw', function() {
        assert.throws(function() { StorytellerUtils.findClosestAttribute(); });
        assert.throws(function() { StorytellerUtils.findClosestAttribute(4, 4); });
        assert.throws(function() { StorytellerUtils.findClosestAttribute($('<div>'), 3); });
        assert.throws(function() { StorytellerUtils.findClosestAttribute(4, 'a string'); });
        assert.throws(function() { StorytellerUtils.findClosestAttribute($('<div>')); });
        assert.throws(function() { StorytellerUtils.findClosestAttribute({}, 'a string'); });
      });
    });

    describe('when given an attribute', function() {
      var element;

      beforeEach(function() {
        /* eslint-disable indent */
        var html = [
          '<div data-on-one-ancestor="1" data-on-multiple-ancestors="2">',
            '<div data-on-multiple-ancestors="3">',
              '<div id="element" data-on-self="4"></div>',
            '</div>',
          '</div>'
        ].join('');
        /* eslint-enable indent */

        $transient.append(html);
        element = $transient.find('#element');
      });

      describe('that does not exist in the DOM', function() {
        it('should return undefined', function() {
          assert.equal(StorytellerUtils.findClosestAttribute(element, 'not-there'), undefined);
        });
      });
      describe('that exists on the given element itself', function() {
        it('should return the value of the attribute', function() {
          assert.equal(StorytellerUtils.findClosestAttribute(element, 'data-on-self'), '4');
        });
      });
      describe('that exists on one ancestor of the given element', function() {
        it('should return the value of the attribute on that ancestor', function() {
          assert.equal(StorytellerUtils.findClosestAttribute(element, 'data-on-one-ancestor'), '1');
        });
      });
      describe('that exists on multiple ancestors of the given element', function() {
        it('should return the value of the attribute on the closest ancestor', function() {
          assert.equal(StorytellerUtils.findClosestAttribute(element, 'data-on-multiple-ancestors'), '3');
        });
      });
    });
  });

  describe('.formatValueWithoutRounding()', function() {

    describe('when given non-numeric input', function() {

      it('returns the input value', function() {

        assert.equal(StorytellerUtils.formatValueWithoutRounding(undefined), undefined);
        assert.equal(StorytellerUtils.formatValueWithoutRounding(null), null);
        assert.equal(StorytellerUtils.formatValueWithoutRounding(false), false);
        assert.equal(StorytellerUtils.formatValueWithoutRounding('test'), 'test');
      });
    });

    describe('when given numeric input', function() {

      describe('when given a value (-1000, 1000)', function() {

        it('does not change the unit but rounds to the tenths place (except with nines)', function() {

          assert.equal(StorytellerUtils.formatValueWithoutRounding(-999.999), '-999.9');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-999.599), '-999.6');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-999.509), '-999.5');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(0), '0');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(0.0), '0');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(999.509), '999.5');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(999.599), '999.6');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(999.999), '999.9');
        });
      });

      describe('when given a value (-1,000,000, -1000] or [1000, 1,000,000)', function() {

        it('changes the unit to thousands and rounds to the hundreds place (except with nines)', function() {

          assert.equal(StorytellerUtils.formatValueWithoutRounding(-999999.999), '-999.9K');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-999599.599), '-999.6K');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-999509.509), '-999.5K');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-1599.999), '-1.6K');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-1509.999), '-1.5K');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-1000.999), '-1K');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-1000), '-1K');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(1000), '1K');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(1000.999), '1K');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(1509.999), '1.5K');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(1599.999), '1.6K');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(999509.509), '999.5K');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(999599.599), '999.6K');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(999999.999), '999.9K');
        });
      });

      describe('when given a value (-1,000,000,000, -1,000,000] or [1,000,000, 1,000,000,000)', function() {

        it('changes the unit to millions and rounds to the hundred-thousands place (except with nines)', function() {

          assert.equal(StorytellerUtils.formatValueWithoutRounding(-999999999.999), '-999.9M');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-999599999.599), '-999.6M');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-999509999.509), '-999.5M');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-1599999.999), '-1.6M');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-1509999.999), '-1.5M');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-1000000.999), '-1M');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-1000000), '-1M');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(1000000), '1M');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(1000000.999), '1M');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(1509999.999), '1.5M');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(1599999.999), '1.6M');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(999509999.509), '999.5M');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(999599999.599), '999.6M');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(999999999.999), '999.9M');
        });
      });

      describe('when given a value (-1,000,000,000,000, -1,000,000,000] or [1,000,000,000, 1,000,000,000,000)', function() {

        it('changes the unit to billions and rounds to the hundred-millions place (except with nines)', function() {

          assert.equal(StorytellerUtils.formatValueWithoutRounding(-999999999999.999), '-999.9B');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-999599999999.599), '-999.6B');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-999509999999.509), '-999.5B');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-1599999999.999), '-1.6B');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-1509999999.999), '-1.5B');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-1000000000.999), '-1B');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-1000000000), '-1B');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(1000000000), '1B');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(1000000000.999), '1B');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(1509999999.999), '1.5B');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(1599999999.999), '1.6B');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(999509999999.509), '999.5B');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(999599999999.599), '999.6B');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(999999999999.999), '999.9B');
        });
      });

      describe('when given a value (-infinity, -1,000,000,000,000] or [1,000,000,000,000, +infinity)', function() {

        it('changes the unit to trillions and behaves erratically', function() {

          // Note: PhantomJS appears to implement `.toLocaleString()` as an alias of `.toString(),
          // so we expect it to format the thousands-values like `1000`. In actual browsers, it may
          // be more likely rendered as `1,000` in the US locale, and something different in other
          // locales.
          //
          // Furthermore, (presumably because JavaScript numbers are all floating point), we seem to
          // end up with rounded numbers around 15 digits. These tests basically only check that there
          // has not been a regression resulting in the output of the function being completely wrong
          // (e.g. undefined as opposed to a number-looking string).
          // Some of these checks use match() due to browser differences.
          assert.match(StorytellerUtils.formatValueWithoutRounding(-1000000000000000.00), /-1,?000T/);
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-99999999999999.999), '-100T');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-99959999999999.599), '-99.9T');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-99950999999999.509), '-99.9T');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-1599999999999.999), '-1.6T');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-1509999999999.999), '-1.5T');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-1000000000000.999), '-1T');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(-1000000000000), '-1T');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(1000000000000), '1T');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(1000000000000.999), '1T');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(1509999999999.999), '1.5T');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(1599999999999.999), '1.6T');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(99950999999999.509), '99.9T');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(99959999999999.599), '99.9T');
          assert.equal(StorytellerUtils.formatValueWithoutRounding(99999999999999.999), '100T');
          assert.match(StorytellerUtils.formatValueWithoutRounding(1000000000000000.00), /1,?000T/);
        });
      });
    });
  });

  describe('fetchDomainConfigurationHash', function() {
    var fakeDomainConfigurationsResponse = [
      { id: 'one', name: 'some config', type: 'awesome', properties: [ { name: 'foo.bar', value: 'baz' } ] },
      { id: 'two', name: 'some other config', type: 'awesomer', properties: [ { name: 'meep', value: 'beep' } ] }
    ];

    beforeEach(function() {
      sinon.stub(StorytellerUtils, 'fetchDomainConfigurations').callsFake(function() {
        return Promise.resolve(_.cloneDeep(fakeDomainConfigurationsResponse));
      });
    });

    it('should pass domain and options to fetchDomainConfigurations', function() {
      StorytellerUtils.fetchDomainConfigurationHash('theDomain', { options: 'hash' });
      sinon.assert.calledWithExactly(StorytellerUtils.fetchDomainConfigurations, 'theDomain', { options: 'hash' });
    });

    it('should flatten property values', function(done) {
      StorytellerUtils.fetchDomainConfigurationHash('foo', {}).then(function(response) {
        assert.deepEqual(_.map(response, 'properties'), [
          { foo: { bar: 'baz' } },
          { meep: 'beep' }
        ]);
        done();
      });
    });

    it('should preserve the rest of the config metadata', function(done) {
      StorytellerUtils.fetchDomainConfigurationHash('foo', {}).then(function(response) {
        assert.propertyVal(response[0], 'id', 'one');
        assert.propertyVal(response[1], 'id', 'two');
        assert.propertyVal(response[0], 'type', 'awesome');
        assert.propertyVal(response[1], 'type', 'awesomer');
        done();
      });
    });

    afterEach(function() { StorytellerUtils.fetchDomainConfigurations.restore(); });
  });

  describe('keyByPath', function() {
    function test(subject, expected) {
      assert.deepEqual(StorytellerUtils.keyByPath(subject, 'name', 'value'), expected);
    }

    it('keys by path', function() {
      test([], {});
      test([ { name: 'foo', value: 'bar' } ], { foo: 'bar' });
      test([
        { name: 'a', value: '1' },
        { name: 'b', value: '2' },
        { name: 'c.a', value: '3' },
        { name: 'c.b', value: '4' },
        { name: 'd.a.a', value: '5' },
        { name: 'd.a.b', value: '6' },
        { name: 'f.o.o.b.a.r', value: '7' }
      ], {
        a: '1',
        b: '2',
        c: { a: '3', b: '4' },
        d: { a: { a: '5', b: '6' } },
        f: { o: { o: { b: { a: { r: '7' } } } } }
      });
    });
  });
});
