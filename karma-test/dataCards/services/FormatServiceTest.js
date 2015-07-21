describe('FormatService', function() {
  'use strict';

  var FormatService;

  beforeEach(module('dataCards.services'));
  beforeEach(inject(function($injector) {
    FormatService = $injector.get('FormatService');
  }));

  var VALID_FORMATTED_NUMBER = /^-?(\d\,\d{3}|((\d(\.\d{1,2})?|\d{2}(\.\d)?|\d{3})[A-Z])|\d(\.\d{1,3})?|\d{2}(\.\d{1,2})?|\d{3}(\.\d)?)$/;

  describe('formatNumber', function() {
    function test(input, output, options) {
      var result = FormatService.formatNumber(input, options);
      var negativeResult = FormatService.formatNumber(-input, options);
      expect(result).to.equal(output);
      expect(result).to.match(VALID_FORMATTED_NUMBER);
      expect(negativeResult).to.equal('-' + output);
      expect(negativeResult).to.match(VALID_FORMATTED_NUMBER);
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

      it('should preserve decimals if they do not exceed a length of 4', function() {
        test(.001, '0.001');
        test(0.05, '0.05');
        test(10.8, '10.8');
        test(100.2, '100.2');
        test(999.1, '999.1');
        test(1000.5, '1,001');
      });

      it('should not return zero for very small decimals', function() {
        expect(FormatService.formatNumber(.0012)).to.equal('0.001');
        expect(FormatService.formatNumber(.0002)).to.equal('0.0002');
        expect(FormatService.formatNumber(.0005)).to.equal('0.0005');
        expect(FormatService.formatNumber(.0004999)).to.equal('0.0004999');
      });

      it('should commaify numbers with absolute value between 1000 and 9999', function() {
        test(1000, '1,000');
        test(5000, '5,000');
        test(9999.4999, '9,999');
        test(9999.9999, '10K');
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
        test(100100, '100K');
        test(999999, '1M');
      });

      it('should abbreviate numbers in the millions', function() {
        test(1000000, '1M');
        test(10000000, '10M');
        test(100000000, '100M');
      });

      it('should abbreviate numbers in the billions', function() {
        test(1000000000, '1B');
        test(1000005678, '1B');
        test(1012345678, '1.01B');
      });

      it('should abbreviate numbers that are really big', function() {
        test(1000000000000, '1T');
        test(1000000000000000, '1P');
        test(1000000000000000000, '1E');
        test(1000000000000000000000, '1Z');
        test(1000000000000000000000000, '1Y');
        test(9999999999999999999999999, '10Y');
        test(99999999999999999999999999, '100Y');
        test(100000000000000000000000000, '100Y');
        expect(FormatService.formatNumber(1000000000000000000000000000)).to.equal('1e+27');
      });
    });

    it('group separator option', function() {
      expect(FormatService.formatNumber(12.34, { groupCharacter: '|' })).to.equal('12.34');
      expect(FormatService.formatNumber(1234, { groupCharacter: '|' })).to.equal('1|234');
    });

    it('decimal separator option', function() {
      expect(FormatService.formatNumber(12.34, { decimalCharacter: ',' })).to.equal('12,34');
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
      expect(FormatService.commaify(20000, { groupCharacter: '?' })).to.equal('20?000');
      expect(FormatService.commaify(2000000, { groupCharacter: '?' })).to.equal('2?000?000');
    });

    it('should deal with decimals correctly using the default separator', function() {
      expect(FormatService.commaify(20000.1234)).to.equal('20,000.1234');
      expect(FormatService.commaify(20000.1234, { groupCharacter: ',' })).to.equal('20,000.1234');
    });

    it('should convert decimals correctly using a custom separator', function() {
      expect(FormatService.commaify('20000|1234', { groupCharacter: ',', decimalCharacter: '|' })).to.equal('20,000|1234');
    });

    it('should convert string numbers correctly', function() {
      expect(FormatService.commaify('20000.1234')).to.equal('20,000.1234');
    });
  });
});
