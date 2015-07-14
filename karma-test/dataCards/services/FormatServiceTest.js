describe('FormatService', function() {
  'use strict';

  var FormatService;

  beforeEach(module('dataCards.services'));
  beforeEach(inject(function($injector) {
    FormatService = $injector.get('FormatService');
  }));

  describe.only('formatNumber', function() {
    function test(input, output, options) {
      expect(FormatService.formatNumber(input, options)).to.equal(output);
      expect(FormatService.formatNumber(-input, options)).to.equal('-' + output);
    }

    describe('default options', function() {
      it('should leave zero alone', function() {
        expect(FormatService.formatNumber(0)).to.equal('0');
      });

      it('should not change numbers between -999 and 999', function() {
        test(999, '999');
        test(600, '600');
        test(99, '99');
        test(50, '50');
        test(49, '49');
        test(9, '9');
      });

      it('should preserve decimals if they do not exceed the default max length of 4', function() {
        test(0.05, '0.05');
        test(10.8, '10.8');
        test(100.2, '100.2');
        test(999.1, '999.1');
        test(1000.5, '1,001');
      });

      it('should commaify numbers with absolute value between 1000 and 9999', function() {
        test(1000, '1,000');
        test(5000, '5,000');
        test(9999.4999, '9,999');
      });

      it('should abbreviate other numbers in the thousands', function() {
        test(9999.5, '10K');
        test(10000, '10K');
        test(10001, '10K');
        test(10500, '10.5K');
        test(10501, '10.5K');
        test(10551, '10.6K');
        test(99499, '99.5K');
        test(99500, '99.5K');
        test(999999, '1M');
      });

      it('should abbreviate numbers in the millions', function() {
        test(1000000, '1M');
        test(10000000, '10M');
        test(100000000, '100M');
      });

      it('should abbreviate numbers in the billions', function() {
        test(1000000000, '1B');
      });

      it('should abbreviate numbers that are really big', function() {
        test(1000000000000, '1T');
        test(1000000000000000, '1P');
        test(1000000000000000000, '1E');
        test(1000000000000000000000, '1Z');
        test(1000000000000000000000000, '1Y');
      });
    });

    describe('precision option', function() {
      it('should throw when passed a negative precision', function() {
        expect(_.curry(FormatService.formatNumber, 0.01, { precision: -1 })).to.throw;
      });

      it('should try to include the specified number of decimal points, respecting maxLength', function() {
        test(42.8125, '42.8', { precision: 1 });
        test(42.8125, '42.81', { precision: 2 });
        test(42.81258472947, '42.81', { precision: 2 });

        test(1425.123, '1,425', { precision: 2 });
        test(1425.123, '1,425.12', { precision: 3, maxLength: 6 });
        test(1425.123, '1,425.123', { precision: 3, maxLength: 7 });
      });
    });

    describe('maxLength option', function() {
      it('should throw when passed a negative maxLength', function() {
        expect(_.curry(FormatService.formatNumber, 0, { maxLength: -1 })).to.throw;
      });

      it('should not truncate numbers if the maxLength is too short', function() {
        test(1, '1', { maxLength: 0 });
        test(500, '500', { maxLength: 1 });
        test(10000000, '10M', { maxLength: 1 });
      });

      it('should abbreviate numbers more aggressively if they exceed the maxLength', function() {
        test(17672123, '17,672,123', { maxLength: 15 });
        test(17672123, '17.67M', { maxLength: 5 });
        test(17672123, '18M', { maxLength: 3 });
      });
    });
  });

  describe('commaify', function() {
    it('should leave zero alone', function() {
      expect(FormatService.commaify(0)).to.equal('0');
    });

    it('should preserve the negative sign', function() {
      expect(FormatService.commaify(-1000)).to.equal('-1,000');
    });

    it('should convert integers correctly using the default separator', function() {
      expect(FormatService.commaify(20000)).to.equal('20,000');
      expect(FormatService.commaify(2000000)).to.equal('2,000,000');
    });

    it('should convert integers correctly using a custom separator', function() {
      expect(FormatService.commaify(20000, '?')).to.equal('20?000');
      expect(FormatService.commaify(2000000, '?')).to.equal('2?000?000');
    });

    it('should deal with decimals correctly using the default separator', function() {
      expect(FormatService.commaify(20000.1234)).to.equal('20,000.1234');
      expect(FormatService.commaify(20000.1234, ',')).to.equal('20,000.1234');
    });

    it('should convert decimals correctly using a custom separator', function() {
      expect(FormatService.commaify('20000|1234', ',', '|')).to.equal('20,000|1234');
    });

    it('should convert string numbers correctly', function() {
      expect(FormatService.commaify('20000.1234')).to.equal('20,000.1234');
    });
  });
});
