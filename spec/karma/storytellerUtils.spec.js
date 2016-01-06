describe('storytellerUtils', function() {

  'use strict';

  var utils = window.socrata.utils;

  describe('.typeToClassNameForComponentType()', function() {

    it('should throw when provided a value that is not a string', function() {
      assert.throws(function() {
        utils.typeToClassNameForComponentType({});
      });
    });

    it('should return a "component-", hyphenated word string when provided a valid string', function() {
      assert.equal(
        utils.typeToClassNameForComponentType('helloWorld'),
        'component-hello-world'
      );
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
            utils.mapDOMFragmentDescending(
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
            utils.mapDOMFragmentDescending(
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
            utils.mapDOMFragmentDescending(
              validElement,
              validApplyFn,
              null
            );
          });
        });
      });

      describe('when called with a pass-through applyFn', function() {

        it('should not change the fragment', function() {

          var newFragment = utils.mapDOMFragmentDescending(
            validElement,
            validApplyFn,
            validShouldTerminateFn
          );

          assert.deepEqual(newFragment, validElement);
        });
      });

      describe('when called with a applyFn that changes non-div elements to divs', function() {

        it('should convert non-div elements to div elements', function() {

          var newFragment = utils.mapDOMFragmentDescending(
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
            utils.reduceDOMFragmentAscending(
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
            utils.reduceDOMFragmentAscending(
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
            utils.reduceDOMFragmentAscending(
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
            utils.reduceDOMFragmentAscending(
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

          var accumulated = utils.reduceDOMFragmentAscending(
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

          var accumulated = utils.reduceDOMFragmentAscending(
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

          var accumulated = utils.reduceDOMFragmentAscending(
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
            utils.reduceDOMFragmentDescending(
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
            utils.reduceDOMFragmentDescending(
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
            utils.reduceDOMFragmentDescending(
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
            utils.reduceDOMFragmentDescending(
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

          var accumulated = utils.reduceDOMFragmentDescending(
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

          var accumulated = utils.reduceDOMFragmentDescending(
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

          var accumulated = utils.reduceDOMFragmentDescending(
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
          utils.generateYoutubeUrl();
        });
      });
    });

    describe('given an id', function() {

      it('should generate the expected url', function() {

        var youtubeId = 'ABCDEFGHIJK';
        var expectedUrl = 'https://www.youtube.com/embed/' + youtubeId;

        assert.equal(expectedUrl, utils.generateYoutubeUrl(youtubeId));
      });
    });
  });

  describe('.generateYoutubeIframeSrc()', function() {

    describe('not given an id', function() {

      it('should throw an error', function() {

        assert.throw(function() {
          utils.generateYoutubeUrl();
        });
      });
    });

    describe('given an id', function() {

      describe('when the autoplay argument is undefined', function() {

        it('should generate the expected url', function() {

          var youtubeId = 'ABCDEFGHIJK';
          var expectedUrl = 'https://www.youtube.com/embed/' + youtubeId + '?rel=0&showinfo=0';

          assert.equal(expectedUrl, utils.generateYoutubeIframeSrc(youtubeId));
        });
      });

      describe('when the autoplay argument is false', function() {

        it('should generate the expected url', function() {

          var youtubeId = 'ABCDEFGHIJK';
          var expectedUrl = 'https://www.youtube.com/embed/' + youtubeId + '?rel=0&showinfo=0';

          assert.equal(expectedUrl, utils.generateYoutubeIframeSrc(youtubeId, false));
        });
      });

      describe('when the autoplay argument is true', function() {

        it('should generate the expected url', function() {

          var youtubeId = 'ABCDEFGHIJK';
          var expectedUrl = 'https://www.youtube.com/embed/' + youtubeId + '?rel=0&showinfo=0&autoplay=true';

          assert.equal(expectedUrl, utils.generateYoutubeIframeSrc(youtubeId, true));
        });
      });
    });
  });

  describe('.findClosestAttribute', function() {
    describe('when given invalid arguments', function() {
      it('should throw', function() {
        assert.throws(function() { utils.findClosestAttribute(); });
        assert.throws(function() { utils.findClosestAttribute(4, 4); });
        assert.throws(function() { utils.findClosestAttribute($('<div>'), 3); });
        assert.throws(function() { utils.findClosestAttribute(4, 'a string'); });
        assert.throws(function() { utils.findClosestAttribute($('<div>')); });
        assert.throws(function() { utils.findClosestAttribute({}, 'a string'); });
      });
    });

    describe('when given an attribute', function() {
      var element;

      beforeEach(function() {
        var html = [
          '<div data-on-one-ancestor="1" data-on-multiple-ancestors="2">',
            '<div data-on-multiple-ancestors="3">',
              '<div id="element" data-on-self="4"></div>',
            '</div>',
          '</div>'
        ].join('');

        testDom.append(html);
        element = testDom.find('#element');
      });


      describe('that does not exist in the DOM', function() {
        it('should return undefined', function() {
          assert.equal(utils.findClosestAttribute(element, 'not-there'), undefined);
        });
      });
      describe('that exists on the given element itself', function() {
        it('should return the value of the attribute', function() {
          assert.equal(utils.findClosestAttribute(element, 'data-on-self'), '4');
        });
      });
      describe('that exists on one ancestor of the given element', function() {
        it('should return the value of the attribute on that ancestor', function() {
          assert.equal(utils.findClosestAttribute(element, 'data-on-one-ancestor'), '1');
        });
      });
      describe('that exists on multiple ancestors of the given element', function() {
        it('should return the value of the attribute on the closest ancestor', function() {
          assert.equal(utils.findClosestAttribute(element, 'data-on-multiple-ancestors'), '3');
        });
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
  });
});
