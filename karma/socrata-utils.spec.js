describe('socrata-utils.js', function() {

  'use strict';

  var utils = window.socrata.utils;

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

  describe('String.prototype.format', function() {

    it('should correctly inteprolate values by index', function() {
      expect('{0}, {1}, {2}, {3}, {4}'.format(1, '2', 3, 4, 'five')).to.equal('1, 2, 3, 4, five');
    });
  });

  describe('String.prototype.formatWithNames', function() {

    it('should replace numeric tokens when string arguments are given', function() {

      expect('test {0} test'.formatWithNames('TEST')).to.equal('test TEST test');
      expect('{0} TEST {1}'.formatWithNames('one', 'two')).to.equal('one TEST two');
    });

    it('should not replace non-numeric token-like entities if string arguments are given', function() {

      expect('{x}-{y}-{z}-{0}-{1}'.formatWithNames('one', 'two')).to.equal('{x}-{y}-{z}-one-two');
      expect('{x}'.formatWithNames('one')).to.equal('{x}');
    });
  });
});
