import * as numbers from 'common/numbers';

describe('numbers', () => {
  describe('getPrecision', () => {
    it('returns 1 for whole numbers', () => {
      expect(numbers.getPrecision(0)).to.equal(1);
      expect(numbers.getPrecision(-1)).to.equal(1);
      expect(numbers.getPrecision(1)).to.equal(1);
      expect(numbers.getPrecision(569)).to.equal(1);
    });

    it('returns .1 for numbers with a single decimal place', () => {
      expect(numbers.getPrecision(.1)).to.equal(.1);
      expect(numbers.getPrecision(-.1)).to.equal(.1);
      expect(numbers.getPrecision(-.900)).to.equal(.1);
      expect(numbers.getPrecision(.5)).to.equal(.1);
    });

    it('returns .01 for numbers with two decimal places', () => {
      expect(numbers.getPrecision(.01)).to.equal(.01);
      expect(numbers.getPrecision(.0100000)).to.equal(.01);
      expect(numbers.getPrecision(-.01)).to.equal(.01);
      expect(numbers.getPrecision(.110)).to.equal(.01);
      expect(numbers.getPrecision(.99)).to.equal(.01);
      expect(numbers.getPrecision(0.91)).to.equal(.01);
    });

    it('fails gracefully', () => {
      expect(numbers.getPrecision('purple')).to.equal(1);
      expect(numbers.getPrecision(Infinity)).to.equal(1);
      expect(numbers.getPrecision(NaN)).to.equal(1);
      expect(numbers.getPrecision({})).to.equal(1);
    });
  });

  describe('roundToPrecision', () => {
    it('rounds to a whole number when precision is 1', () => {
      expect(numbers.roundToPrecision(5.1, 1)).to.equal(5);
      expect(numbers.roundToPrecision(-1.1, 1)).to.equal(-1);
      expect(numbers.roundToPrecision(.001, 1)).to.equal(0);
      expect(numbers.roundToPrecision(100.9, 1)).to.equal(101);
      expect(numbers.roundToPrecision(19, 1)).to.equal(19);
    });

    it('rounds to three decimal places when precision is .001', () => {
      expect(numbers.roundToPrecision(5.1, .001)).to.equal(5.1);
      expect(numbers.roundToPrecision(1.7899, .001)).to.equal(1.79);
      expect(numbers.roundToPrecision(-.0025, .001)).to.equal(-.002);
      expect(numbers.roundToPrecision(3, .001)).to.equal(3);
    });

    it('fails gracefully', () => {
      expect(numbers.roundToPrecision(5.1, -5)).to.equal(5.1);
      expect(numbers.roundToPrecision(1.7899, NaN)).to.equal(1.7899);
      expect(numbers.roundToPrecision(NaN, 3)).to.be.NaN;
      expect(numbers.roundToPrecision(Infinity, 1)).to.equal(Infinity);
    });
  });
});
