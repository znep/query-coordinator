describe('Util', function() {

  'use strict';

  var object = {
    propA: null,
    propB: 5,
    propC: 'asd'
  };

  describe('assertEqual', function() {

    describe('given two unequal values', function() {

      it('throws an error', function() {

        assert.throw(function() {
          Util.assertEqual(1, 2);
        });
      });
    });

    describe('given two equal values', function() {

      it('does not throw an error', function() {

        Util.assertEqual('equal', 'equal');
      });
    });
  });

  describe('assertHasProperty', function() {

    describe('given an object with the desired property', function() {

      it('does not throw', function() {
        window.Util.assertHasProperty(object, 'propA');
      });
    });

    describe('given an object without the desired property', function() {

      it('throws', function() {
        assert.throw(function() {
          window.Util.assertHasProperty(object, 'oops');
        });
      });
    });
  });

  describe('assertHasProperties', function() {

    describe('given an object with all the desired properties', function() {

      it('does not throw', function() {
        window.Util.assertHasProperties(object, 'propA', 'propB');
      });
    });

    describe('given an object without the desired property', function() {

      it('throws', function() {
        assert.throw(function() {
          window.Util.assertHasProperties(object, 'propA', 'propOops');
        });
      });
    });
  });

  describe('assertTypeof', function() {

    describe('given a value of a different than specified type', function() {

      assert.throw(function() {
        Util.assertTypeof(1, 'boolean');
      });

      assert.throw(function() {
        Util.assertTypeof(1, 'string');
      });

      assert.throw(function() {
        Util.assertTypeof('1', 'number');
      });

      assert.throw(function() {
        Util.assertTypeof(1, 'object');
      });

      assert.throw(function() {
        Util.assertTypeof(1, 'function');
      });
    });

    describe('given a value of the specified type', function() {

      it('does not throw an error', function() {

        Util.assertTypeof(true, 'boolean');
        Util.assertTypeof('string', 'string');
        Util.assertTypeof(1, 'number');
        Util.assertTypeof({}, 'object');
        Util.assertTypeof(function() {}, 'function');
      });
    });
  });

  describe('assertTypeofInArray', function() {

    describe('given a value of type not in the specified array', function() {

      assert.throw(function() {
        Util.assertTypeofInArray(1, ['boolean', 'string']);
      });

      assert.throw(function() {
        Util.assertTypeofInArray(1, ['string', 'boolean']);
      });

      assert.throw(function() {
        Util.assertTypeofInArray('1', ['number', 'object']);
      });

      assert.throw(function() {
        Util.assertTypeofInArray(1, ['object', 'function']);
      });

      assert.throw(function() {
        Util.assertTypeofInArray(1, ['function', 'boolean']);
      });
    });

    describe('given a value of the specified type', function() {

      it('does not throw an error', function() {

        Util.assertTypeofInArray(true, ['string', 'boolean']);
        Util.assertTypeofInArray('string', ['string', 'number']);
        Util.assertTypeofInArray(1, ['function', 'number']);
        Util.assertTypeofInArray({}, ['object', 'string']);
        Util.assertTypeofInArray(function() {}, ['boolean', 'function']);
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
      var validShouldTerminateFn = function(el) { return false; };
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
            window.Util.mapDOMFragmentDescending(
              null,
              validApplyFn,
              validShouldTerminateFun
            );
          });
        });
      });

      describe('when called with an applyFn that is not a function', function() {

        it('throws an error', function() {

          assert.throw(function() {
            window.Util.mapDOMFragmentDescending(
              validElement,
              null,
              validShouldTerminateFun
            );
          });
        });
      });

      describe('when called with a shouldTerminateFn that is not a function', function() {

        it('throws an error', function() {

          assert.throw(function() {
            window.Util.mapDOMFragmentDescending(
              validElement,
              validApplyFn,
              null
            );
          });
        });
      });

      describe('when called with a pass-through applyFn', function() {

        it('should not change the fragment', function() {

          var newFragment = window.Util.mapDOMFragmentDescending(
            validElement,
            validApplyFn,
            validShouldTerminateFn
          );

          assert.deepEqual(newFragment, validElement);
        });
      });

      describe('when called with a applyFn that changes non-div elements to divs', function() {

        it('should convert non-div elements to div elements', function() {

          var newFragment = window.Util.mapDOMFragmentDescending(
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
      var validShouldTerminateFn = function(el) { return false; };
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
            window.Util.reduceDOMFragmentAscending(
              null,
              validApplyFn,
              validShouldTerminateFun,
              validAccumulator
            );
          });
        });
      });

      describe('when called with an applyFn that is not a function', function() {

        it('throws an error', function() {

          assert.throw(function() {
            window.Util.reduceDOMFragmentAscending(
              validChild5,
              null,
              validShouldTerminateFun,
              validAccumulator
            );
          });
        });
      });

      describe('when called with a shouldTerminateFn that is not a function', function() {

        it('throws an error', function() {

          assert.throw(function() {
            window.Util.reduceDOMFragmentAscending(
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
            window.Util.reduceDOMFragmentAscending(
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

          var accumulated = window.Util.reduceDOMFragmentAscending(
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

          var accumulated = window.Util.reduceDOMFragmentAscending(
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

          var accumulated = window.Util.reduceDOMFragmentAscending(
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
      var validShouldTerminateFn = function(el) { return false; };
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
            window.Util.reduceDOMFragmentDescending(
              null,
              validApplyFn,
              validShouldTerminateFun,
              validAccumulator
            );
          });
        });
      });

      describe('when called with an applyFn that is not a function', function() {

        it('throws an error', function() {

          assert.throw(function() {
            window.Util.reduceDOMFragmentDescending(
              validElement,
              null,
              validShouldTerminateFun,
              validAccumulator
            );
          });
        });
      });

      describe('when called with a shouldTerminateFn that is not a function', function() {

        it('throws an error', function() {

          assert.throw(function() {
            window.Util.reduceDOMFragmentDescending(
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
            window.Util.reduceDOMFragmentDescending(
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

          var accumulated = window.Util.reduceDOMFragmentDescending(
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

          var accumulated = window.Util.reduceDOMFragmentDescending(
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

          var accumulated = window.Util.reduceDOMFragmentDescending(
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
});
