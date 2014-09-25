(function() {
  'use strict';
  var AFFIRMATIVE_VALUE = 'truthy';
  var NEGATIVE_VALUE = 'falsy';

  var ifElse;

  describe('ifElse filter', function() {
    beforeEach(function() {
      module('socrataCommon.filters');
      inject(function(ifElseFilter) {
        ifElse = ifElseFilter;
      });
    });

    it('should return the affirmative value with a truthy predicate', function() {
      expect(ifElse(true, AFFIRMATIVE_VALUE, NEGATIVE_VALUE)).to.equal(AFFIRMATIVE_VALUE);
    });

    it('should return the negative value with a falsy predicate', function() {
      expect(ifElse(false, AFFIRMATIVE_VALUE, NEGATIVE_VALUE)).to.equal(NEGATIVE_VALUE);
    });

  });

})();
