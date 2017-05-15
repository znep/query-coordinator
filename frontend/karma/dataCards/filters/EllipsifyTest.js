import { expect, assert } from 'chai';
const angular = require('angular');

describe('ellipsify filter', function() {
  'use strict';

  var ellipsify;

  beforeEach(angular.mock.module('dataCards'));

  beforeEach(function() {
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
        assert.isTrue(_.isNaN(ellipsify(badValue, 1)));
      } else {
        expect(ellipsify(badValue, 1)).to.equal(badValue);
      }
    });
  });
});
