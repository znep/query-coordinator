describe('ellipsify filter', function() {
  'use strict';

  var ellipsify;

  beforeEach(function() {
    module('dataCards.filters');

    inject(function(ellipsifyFilter) {
      ellipsify = ellipsifyFilter;
    });
  });

  it('should ellipsify a value if the truncation length is less than the string length', function() {
    expect(ellipsify('text', 1)).to.equal('t...');
  });

  it('should not ellipsify a value if the truncation length is greater than the string length', function() {
    expect(ellipsify('text', 5)).to.equal('text');
  });

  it('should artfully handle the truncation length being 0', function() {
    expect(ellipsify('text', 0)).to.equal('...');
  });

  it('should not ellipsify if the truncation length is negative, infinite, or NaN', function() {
    var badLengths = [-1, NaN, Infinity];

    _.each(badLengths, function(badLength) {
      expect(ellipsify('text', badLength)).to.equal('text');
    });
  });

  it('should return the value unchanged if the value is not a string', function() {
    var badValues = [undefined, null, 1, NaN, {}];

    _.each(badValues, function(badValue) {

      // NaN !== NaN
      if (_.isNaN(badValue)) {
        expect(_.isNaN(ellipsify(badValue, 1))).to.be.true;
      } else {
        expect(ellipsify(badValue, 1)).to.equal(badValue);
      }
    });
  });
});
