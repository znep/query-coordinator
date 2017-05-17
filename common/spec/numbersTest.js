import * as numbers from 'common/numbers';

describe('numbers', () => {
  describe('getPrecision', () => {
    it('returns 1 for whole numbers', () => {
      assert.equal(numbers.getPrecision(0), 1);
      assert.equal(numbers.getPrecision(-1), 1);
      assert.equal(numbers.getPrecision(1), 1);
      assert.equal(numbers.getPrecision(569), 1);
    });

    it('returns .1 for numbers with a single decimal place', () => {
      assert.equal(numbers.getPrecision(.1), .1);
      assert.equal(numbers.getPrecision(-.1), .1);
      assert.equal(numbers.getPrecision(-.900), .1);
      assert.equal(numbers.getPrecision(.5), .1);
    });

    it('returns .01 for numbers with two decimal places', () => {
      assert.equal(numbers.getPrecision(.01), .01);
      assert.equal(numbers.getPrecision(.0100000), .01);
      assert.equal(numbers.getPrecision(-.01), .01);
      assert.equal(numbers.getPrecision(.110), .01);
      assert.equal(numbers.getPrecision(.99), .01);
      assert.equal(numbers.getPrecision(0.91), .01);
    });

    it('fails gracefully', () => {
      assert.equal(numbers.getPrecision('purple'), 1);
      assert.equal(numbers.getPrecision(Infinity), 1);
      assert.equal(numbers.getPrecision(NaN), 1);
      assert.equal(numbers.getPrecision({}), 1);
    });
  });

  describe('roundToPrecision', () => {
    it('rounds to a whole number when precision is 1', () => {
      assert.equal(numbers.roundToPrecision(5.1, 1), 5);
      assert.equal(numbers.roundToPrecision(-1.1, 1), -1);
      assert.equal(numbers.roundToPrecision(.001, 1), 0);
      assert.equal(numbers.roundToPrecision(100.9, 1), 101);
      assert.equal(numbers.roundToPrecision(19, 1), 19);
    });

    it('rounds to three decimal places when precision is .001', () => {
      assert.equal(numbers.roundToPrecision(5.1, .001), 5.1);
      assert.equal(numbers.roundToPrecision(1.7899, .001), 1.79);
      assert.equal(numbers.roundToPrecision(-.0025, .001), -.002);
      assert.equal(numbers.roundToPrecision(3, .001), 3);
    });

    it('fails gracefully', () => {
      assert.equal(numbers.roundToPrecision(5.1, -5), 5.1);
      assert.equal(numbers.roundToPrecision(1.7899, NaN), 1.7899);
      assert.isNaN(numbers.roundToPrecision(NaN, 3));
      assert.equal(numbers.roundToPrecision(Infinity, 1), Infinity);
    });
  });
});
