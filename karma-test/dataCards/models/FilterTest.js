describe("Filter models", function() {
  beforeEach(module('dataCards'));

  describe('IsNullFilter', function() {
    var fakeColumnName = _.uniqueId();
    it('should throw if the constructor is passed non-booleans', inject(function(Filter) {
      expect(function() { new Filter.IsNullFilter(); }).to.throw();
      expect(function() { new Filter.IsNullFilter(null); }).to.throw();
      expect(function() { new Filter.IsNullFilter(0); }).to.throw();
      expect(function() { new Filter.IsNullFilter(3); }).to.throw();
      expect(function() { new Filter.IsNullFilter(''); }).to.throw();
    }));

    it('should generate correct SOQL for isNull = true', inject(function(Filter) {
      var filter = new Filter.IsNullFilter(true);
      expect(filter.generateSoqlWhereFragment(fakeColumnName)).to.equal(fakeColumnName + " IS NULL");
    }));

    it('should generate correct SOQL for isNull = false', inject(function(Filter) {
      var filter = new Filter.IsNullFilter(false);
      expect(filter.generateSoqlWhereFragment(fakeColumnName)).to.equal(fakeColumnName + " IS NOT NULL");
    }));
  });

  describe('BinaryOperatorFilter', function() {
    var fakeColumnName = _.uniqueId();
    it('should generate correct SOQL for the given operator and string operand', inject(function(Filter) {
      var filter = new Filter.BinaryOperatorFilter('>', 'CKAN');
      expect(filter.generateSoqlWhereFragment('SOCRATA')).to.equal("SOCRATA>'CKAN'");
    }));

    it('should throw if the constructor is passed bad or unsupported arguments', inject(function(Filter) {
      expect(function() { new Filter.BinaryOperatorFilter(); }).to.throw();
      expect(function() { new Filter.BinaryOperatorFilter(null); }).to.throw();
      expect(function() { new Filter.BinaryOperatorFilter(0); }).to.throw();
      expect(function() { new Filter.BinaryOperatorFilter(3); }).to.throw();
      expect(function() { new Filter.BinaryOperatorFilter('foo'); }).to.throw();

      expect(function() { new Filter.BinaryOperatorFilter('', ''); }).to.throw();
      expect(function() { new Filter.BinaryOperatorFilter('=', null); }).to.throw();
      expect(function() { new Filter.BinaryOperatorFilter(null, 'asd'); }).to.throw();
      expect(function() { new Filter.BinaryOperatorFilter(undefined, 'dsa'); }).to.throw();
    }));
  });
});
