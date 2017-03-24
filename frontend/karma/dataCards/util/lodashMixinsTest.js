describe('lodash mixins', function() {
  'use strict';

  describe('isDefined', function() {
    it('should return true for everything but "undefined"', function() {
      expect(_.isDefined(true)).to.equal(true);
      expect(_.isDefined(null)).to.equal(true);
      expect(_.isDefined(false)).to.equal(true);
      expect(_.isDefined(0)).to.equal(true);
      expect(_.isDefined(NaN)).to.equal(true);
      expect(_.isDefined(undefined)).to.equal(false);
    });
  });

  describe('isPresent', function() {

    it('should return true for "present" values', function() {
      expect(_.isPresent('string')).to.equal(true);
      expect(_.isPresent(1)).to.equal(true);
      expect(_.isPresent(['one'])).to.equal(true);
      expect(_.isPresent({ foo: 'bar' })).to.equal(true);
      expect(_.isPresent(true)).to.equal(true);
      expect(_.isPresent(false)).to.equal(true);
    });

    it('should return false for non-present values', function() {
      expect(_.isPresent('')).to.equal(false);
      expect(_.isPresent(0)).to.equal(false);
      expect(_.isPresent([])).to.equal(false);
      expect(_.isPresent(null)).to.equal(false);
      expect(_.isPresent(undefined)).to.equal(false);
      expect(_.isPresent(NaN)).to.equal(false);
    });

  });

  describe('negateValue', function() {
    it('negates the parameter', function() {
      expect(_.negateValue(true)).to.equal(false);
      expect(_.negateValue(false)).to.equal(true);
      expect(_.negateValue(null)).to.equal(true);
      expect(_.negateValue(246)).to.equal(false);
    });
  });

});
