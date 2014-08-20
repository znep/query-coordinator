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

  describe('TimeRangeFilter', function() {
    var fakeColumnName = _.uniqueId();
    it('should throw if the constructor is passed invalid moments', inject(function(Filter) {
      expect(function() { new Filter.TimeRangeFilter(); }).to.throw();
      expect(function() { new Filter.TimeRangeFilter(null); }).to.throw();
      expect(function() { new Filter.TimeRangeFilter(0); }).to.throw();
      expect(function() { new Filter.TimeRangeFilter(3); }).to.throw();
      expect(function() { new Filter.TimeRangeFilter(''); }).to.throw();
      expect(function() { new Filter.TimeRangeFilter(moment('pants', moment.ISO_8601), moment()); }).to.throw();
      expect(function() { new Filter.TimeRangeFilter(moment(), moment('trousers', moment.ISO_8601)); }).to.throw();
      expect(function() { new Filter.TimeRangeFilter(moment(), 123); }).to.throw();
      expect(function() { new Filter.TimeRangeFilter(123, moment()); }).to.throw();
    }));

    it('should generate correct SOQL', inject(function(Filter, SoqlHelpers) {
      var start = moment('1988-01-10T08:00:00.000Z');
      var end = moment('2101-01-10T08:00:00.000Z');
      var filter = new Filter.TimeRangeFilter(start, end);

      var expected = "{0} > {1} AND {0} < {2}".format(fakeColumnName, SoqlHelpers.encodePrimitive(start), SoqlHelpers.encodePrimitive(end));
      expect(filter.generateSoqlWhereFragment(fakeColumnName)).to.equal(expected);
    }));
  });
});
