describe('Filter models', function() {
  beforeEach(module('dataCards'));

  function parseAsJson(obj) {
    return JSON.parse(JSON.stringify(obj));
  };

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

    it('should serialize and deserialize properly', inject(function(Filter) {
      var filterNotNull = new Filter.IsNullFilter(false);
      var filterNull = new Filter.IsNullFilter(true);

      var deserializedFilterNotNull = Filter.deserialize(parseAsJson(filterNotNull.serialize()));
      var deserializedFilterNull = Filter.deserialize(parseAsJson(filterNull.serialize()));

      expect(deserializedFilterNotNull).to.deep.equal(filterNotNull);
      expect(deserializedFilterNull).to.deep.equal(filterNull);
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

    it('should serialize and deserialize properly', inject(function(Filter) {
      var filter = new Filter.BinaryOperatorFilter('<', 'some_field');
      var filterWithHumanName = new Filter.BinaryOperatorFilter('<', 'some_field', 'some human-readable text');

      var deserializedFilter = Filter.deserialize(parseAsJson(filter.serialize()));
      var deserializedFilterWithHumanName = Filter.deserialize(parseAsJson(filterWithHumanName.serialize()));

      expect(deserializedFilter).to.deep.equal(filter);
      expect(deserializedFilterWithHumanName).to.deep.equal(filterWithHumanName);
    }));
  });

  describe('TimeRangeFilter', function() {

    it('should throw if the constructor is passed non-Dates', inject(function(Filter) {
      expect(function() { new Filter.TimeRangeFilter(); }).to.throw();
      expect(function() { new Filter.TimeRangeFilter(null); }).to.throw();
      expect(function() { new Filter.TimeRangeFilter(0); }).to.throw();
      expect(function() { new Filter.TimeRangeFilter(3); }).to.throw();
      expect(function() { new Filter.TimeRangeFilter(''); }).to.throw();
    }));

    it('should generate correct SOQL', inject(function(Filter, SoqlHelpers) {
      var fakeColumnName = _.uniqueId();
      var start = '1988-01-10T08:00:00';
      var end = '2101-01-10T08:00:00';
      var filter = new Filter.TimeRangeFilter(start, end);
      var expected = "{0} >= {1} AND {0} < {2}".format(
        fakeColumnName,
        SoqlHelpers.encodePrimitive(start),
        SoqlHelpers.encodePrimitive(end)
      );

      expect(filter.generateSoqlWhereFragment(fakeColumnName)).to.equal(expected);
    }));

    it('should serialize and deserialize properly', inject(function(Filter) {
      var start = '1988-01-10T08:00:00';
      var end = '2101-01-10T08:00:00';
      var filter = new Filter.TimeRangeFilter(start, end);

      var deserializedFilter = Filter.deserialize(parseAsJson(filter.serialize()));

      expect(deserializedFilter.start.getTime()).to.equal(filter.start.getTime());
      expect(deserializedFilter.end.getTime()).to.equal(filter.end.getTime());
    }));

    it('should fail when deserializing with a non-ISO8601 time.', inject(function(Filter) {
      var start = '1988-01-10T08:00:00';
      var end = '2101-01-10T08:00:00';
      var filter = new Filter.TimeRangeFilter(start, end);

      var serializedFilter = parseAsJson(filter.serialize());

      // Hack the serialized form to have a malformed end time.
      serializedFilter['arguments'].end = 'bad date' // Not valid

      expect(function() {
        Filter.deserialize(serializedFilter);
      }).to.throw();
    }));

  });

  it('should throw errors on bad data passed into the top-level deserialize', inject(function(Filter) {
    expect(function() {
      Filter.deserialize();
    }).to.throw();
    expect(function() {
      Filter.deserialize([]);
    }).to.throw();
    expect(function() {
      Filter.deserialize({
        'function': 'bad'
      });
    }).to.throw();
    expect(function() {
      Filter.deserialize({
        'function': 'IsNull'
      });
    }).to.throw();
  }));
});
