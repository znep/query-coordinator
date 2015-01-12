(function() {

  'use strict';

  describe('lo-dash mixins', function() {

    describe('isPresent', function() {

      it('should return true for "present" values', function() {
        expect(_.isPresent('string')).to.be.true;
        expect(_.isPresent(1)).to.be.true;
        expect(_.isPresent(['one'])).to.be.true;
        expect(_.isPresent({ foo: 'bar' })).to.be.true;
      });

      it('should return false for non-present values', function() {
        expect(_.isPresent('')).to.be.false;
        expect(_.isPresent(0)).to.be.false;
        expect(_.isPresent([])).to.be.false;
        expect(_.isPresent(null)).to.be.false;
        expect(_.isPresent(undefined)).to.be.false;
        expect(_.isPresent(NaN)).to.be.false;
      });

    });

  });

})();
