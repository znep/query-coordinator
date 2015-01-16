(function() {

  'use strict';

  describe('lo-dash mixins', function() {

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

  });

})();
