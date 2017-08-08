import { soqlVifValidator } from 'common/visualizations/dataProviders/SoqlVifValidator';

function validatePasses(testCaseFnName, vif, datasetMetadataPerSeries) {
  describe(testCaseFnName, function() {
    var validator;
    beforeEach(function() {
      validator = soqlVifValidator(vif, datasetMetadataPerSeries);
    });

    it('should return the original validator for chaining purposes', function() {
      assert.equal(
        validator[testCaseFnName](),
        validator,
        `${testCaseFnName} did not return validator for chaining`
      );
    });

    it('.validate() should return a passing result', function() {
      assert.propertyVal(validator.validate(), 'ok', true);
    });

    it('.toPromise() should return promise that successfully resolves', function(done) {
      validator[testCaseFnName]();
      validator.toPromise().then(
        () => { done(); },
        (error) => { console.error(error); throw error; }
      );
    });
  });
}

function validateFails(testCaseFnName, vif, datasetMetadataPerSeries) {
  describe(testCaseFnName, function() {
    var validator;
    beforeEach(function() {
      validator = soqlVifValidator(vif, datasetMetadataPerSeries);
    });

    it('should return the original validator for chaining purposes', function() {
      assert.equal(
        validator[testCaseFnName](),
        validator,
        `${testCaseFnName} did not return validator for chaining`
      );
    });

    it('.validate() should return a failing result', function() {
      validator[testCaseFnName]();
      const validation = validator.validate();
      assert.propertyVal(validation, 'ok', false);
      assert.isAtLeast(validation.errorMessages.length, 1);
    });

    it('.toPromise() should return promise that rejects', function(done) {
      validator[testCaseFnName]();
      validator.toPromise().then(
        () => { console.error('Unexpected resolution'); },
        (error) => {
          assert.propertyVal(error, 'ok', false);
          assert.isAtLeast(error.errorMessages.length, 1);
          done();
        }
      );
    });
  });
}

describe('SoqlVifValidator', function() {
  describe('soqlVifValidator', function() {
    it('should throw if dataset metadata is not passed in correctly', function() {
      const vif = {
        format: { type: 'visualization_interchange_format', version: 2 },
        series: [
          {
            dataSource: {
              datasetUid: 'test-test',
              domain: 'example.com',
              dimension: { columnName: 'number', aggregationFunction: null },
              measure: { columnName: null, aggregationFunction: 'count' },
              type: 'socrata.soql',
              filters: []
            }
          }
        ]
      };
      assert.throws(function() {
        soqlVifValidator(vif);
      });
      assert.throws(function() {
        soqlVifValidator(vif, [{}, {}]);
      });

      soqlVifValidator(vif, [{}]);
    });
    describe('VIF with no series', function() {
      const vif = {
        title: 'no series',
        format: { type: 'visualization_interchange_format', version: 2 },
        series: []
      };

      validateFails('requireAtLeastOneSeries', vif, []);
      validateFails('requireExactlyOneSeries', vif, []);
      validatePasses('requireAllSeriesFromSameDomain', vif, []);
      validatePasses('requireNoMeasureAggregation', vif, []);
      validatePasses('requireMeasureAggregation', vif, []);
      validatePasses('requireCalendarDateDimension', vif, []);
      validatePasses('requirePointDimension', vif, []);
      validatePasses('requireNumericDimension', vif, []);
    });

    describe('VIF with a numeric, a date, and point dimensioned series', function() {
      const vif = {
        format: { type: 'visualization_interchange_format', version: 2 },
        series: [
          {
            dataSource: {
              datasetUid: 'test-test',
              domain: 'example.com',
              dimension: { columnName: 'number', aggregationFunction: null },
              measure: { columnName: null, aggregationFunction: 'count' },
              type: 'socrata.soql',
              filters: []
            }
          },
          {
            dataSource: {
              datasetUid: 'test-test',
              domain: 'example.com',
              dimension: { columnName: 'date', aggregationFunction: null },
              measure: { columnName: null, aggregationFunction: 'count' },
              type: 'socrata.soql',
              filters: []
            }
          },
          {
            dataSource: {
              datasetUid: 'test-test',
              domain: 'example.com',
              dimension: { columnName: 'point', aggregationFunction: null },
              measure: { columnName: null, aggregationFunction: 'count' },
              type: 'socrata.soql',
              filters: []
            }
          }
        ]
      };
      const datasetMetadata = {
        columns: [
          { fieldName: 'number', renderTypeName: 'number' },
          { fieldName: 'point', renderTypeName: 'point' },
          { fieldName: 'date', renderTypeName: 'calendar_date' }
        ]
      };

      // all series use same dataset.
      const datasetMetadatas = [ datasetMetadata, datasetMetadata, datasetMetadata ];

      validatePasses('requireAtLeastOneSeries', vif, datasetMetadatas);
      validateFails('requireExactlyOneSeries', vif, datasetMetadatas);
      validatePasses('requireAllSeriesFromSameDomain', vif, datasetMetadatas);
      validateFails('requireNoMeasureAggregation', vif, datasetMetadatas);
      validatePasses('requireMeasureAggregation', vif, datasetMetadatas);
      validateFails('requireCalendarDateDimension', vif, datasetMetadatas);
      validateFails('requirePointDimension', vif, datasetMetadatas);
      validateFails('requireNumericDimension', vif, datasetMetadatas);
    });

    describe('VIF with a numeric dimensioned series', function() {
      const vif = {
        format: { type: 'visualization_interchange_format', version: 2 },
        series: [
          {
            dataSource: {
              datasetUid: 'test-test',
              domain: 'example.com',
              dimension: { columnName: 'number', aggregationFunction: null },
              measure: { columnName: null, aggregationFunction: 'count' },
              type: 'socrata.soql',
              filters: []
            }
          }
        ]
      };
      const datasetMetadata = { columns: [
        { fieldName: 'number', renderTypeName: 'number' }
      ]};

      validatePasses('requireAtLeastOneSeries', vif, [ datasetMetadata ]);
      validatePasses('requireExactlyOneSeries', vif, [ datasetMetadata ]);
      validatePasses('requireAllSeriesFromSameDomain', vif, [ datasetMetadata ]);
      validateFails('requireNoMeasureAggregation', vif, [ datasetMetadata ]);
      validatePasses('requireMeasureAggregation', vif, [ datasetMetadata ]);
      validateFails('requireCalendarDateDimension', vif, [ datasetMetadata ]);
      validateFails('requirePointDimension', vif, [ datasetMetadata ]);
      validatePasses('requireNumericDimension', vif, [ datasetMetadata ]);
    });

    describe('VIF with a money dimensioned series', function() {
      const vif = {
        format: { type: 'visualization_interchange_format', version: 2 },
        series: [
          {
            dataSource: {
              datasetUid: 'test-test',
              domain: 'example.com',
              dimension: { columnName: 'money', aggregationFunction: null },
              measure: { columnName: null, aggregationFunction: 'count' },
              type: 'socrata.soql',
              filters: []
            }
          }
        ]
      };
      const datasetMetadata = { columns: [
        { fieldName: 'money', renderTypeName: 'money' }
      ]};

      validatePasses('requireAtLeastOneSeries', vif, [ datasetMetadata ]);
      validatePasses('requireExactlyOneSeries', vif, [ datasetMetadata ]);
      validateFails('requireNoMeasureAggregation', vif, [ datasetMetadata ]);
      validatePasses('requireMeasureAggregation', vif, [ datasetMetadata ]);
      validateFails('requireCalendarDateDimension', vif, [ datasetMetadata ]);
      validateFails('requirePointDimension', vif, [ datasetMetadata ]);
      validatePasses('requireNumericDimension', vif, [ datasetMetadata ]);
    });

    describe('VIF with a point dimensioned series', function() {
      const vif = {
        format: { type: 'visualization_interchange_format', version: 2 },
        series: [
          {
            dataSource: {
              datasetUid: 'test-test',
              domain: 'example.com',
              dimension: { columnName: 'point', aggregationFunction: null },
              measure: { columnName: null, aggregationFunction: 'count' },
              type: 'socrata.soql',
              filters: []
            }
          }
        ]
      };
      const datasetMetadata = { columns: [
        { fieldName: 'point', renderTypeName: 'point' }
      ]};

      validatePasses('requireAtLeastOneSeries', vif, [ datasetMetadata ]);
      validatePasses('requireExactlyOneSeries', vif, [ datasetMetadata ]);
      validatePasses('requireAllSeriesFromSameDomain', vif, [ datasetMetadata ]);
      validateFails('requireNoMeasureAggregation', vif, [ datasetMetadata ]);
      validatePasses('requireMeasureAggregation', vif, [ datasetMetadata ]);
      validateFails('requireCalendarDateDimension', vif, [ datasetMetadata ]);
      validatePasses('requirePointDimension', vif, [ datasetMetadata ]);
      validateFails('requireNumericDimension', vif, [ datasetMetadata ]);
    });

    describe('VIF with a date dimensioned series', function() {
      const vif = {
        format: { type: 'visualization_interchange_format', version: 2 },
        series: [
          {
            dataSource: {
              datasetUid: 'test-test',
              domain: 'example.com',
              dimension: { columnName: 'date', aggregationFunction: null },
              measure: { columnName: null, aggregationFunction: 'count' },
              type: 'socrata.soql',
              filters: []
            }
          }
        ]
      };
      const datasetMetadata = { columns: [
        { fieldName: 'date', renderTypeName: 'calendar_date' }
      ]};

      validatePasses('requireAtLeastOneSeries', vif, [ datasetMetadata ]);
      validatePasses('requireExactlyOneSeries', vif, [ datasetMetadata ]);
      validatePasses('requireAllSeriesFromSameDomain', vif, [ datasetMetadata ]);
      validateFails('requireNoMeasureAggregation', vif, [ datasetMetadata ]);
      validatePasses('requireMeasureAggregation', vif, [ datasetMetadata ]);
      validatePasses('requireCalendarDateDimension', vif, [ datasetMetadata ]);
      validateFails('requirePointDimension', vif, [ datasetMetadata ]);
      validateFails('requireNumericDimension', vif, [ datasetMetadata ]);
    });

    describe('VIF with an aggregated measure and an unaggregated dimension', function() {
      const vif = {
        format: { type: 'visualization_interchange_format', version: 2 },
        series: [
          {
            dataSource: {
              datasetUid: 'test-test',
              domain: 'example.com',
              dimension: { columnName: 'date', aggregationFunction: null },
              measure: { columnName: null, aggregationFunction: 'count' },
              type: 'socrata.soql',
              filters: []
            }
          }
        ]
      };
      const datasetMetadata = { columns: [
        { fieldName: 'date', renderTypeName: 'calendar_date' }
      ]};

      validateFails('requireNoMeasureAggregation', vif, [ datasetMetadata ]);
      validatePasses('requireMeasureAggregation', vif, [ datasetMetadata ]);
    });

    describe('VIF with two series, one of which is aggregated on measure, and the other is not', function() {
      const vif = {
        format: { type: 'visualization_interchange_format', version: 2 },
        series: [
          {
            dataSource: {
              datasetUid: 'test-test',
              domain: 'example.com',
              dimension: { columnName: 'number', aggregationFunction: null },
              measure: { columnName: null, aggregationFunction: 'count' },
              type: 'socrata.soql',
              filters: []
            }
          },
          {
            dataSource: {
              datasetUid: 'test-test',
              domain: 'example.com',
              dimension: { columnName: 'number', aggregationFunction: null },
              measure: { columnName: 'number2', aggregationFunction: null },
              type: 'socrata.soql',
              filters: []
            }
          }
        ]
      };
      const datasetMetadata = { columns: [
        { fieldName: 'number', renderTypeName: 'number' },
        { fieldName: 'number2', renderTypeName: 'number' }
      ]};

      validateFails('requireNoMeasureAggregation', vif, [ datasetMetadata, datasetMetadata ]);
      validateFails('requireMeasureAggregation', vif, [ datasetMetadata, datasetMetadata ]);
    });

    describe('VIF with a measure aggregated on count', function() {
      const vif = {
        format: { type: 'visualization_interchange_format', version: 2 },
        series: [
          {
            dataSource: {
              datasetUid: 'test-test',
              domain: 'example.com',
              dimension: { columnName: 'number', aggregationFunction: null },
              measure: { columnName: null, aggregationFunction: 'count' },
              type: 'socrata.soql',
              filters: []
            }
          }
        ]
      };
      const datasetMetadata = { columns: [
        { fieldName: 'number', renderTypeName: 'number' }
      ]};

      validateFails('requireNoMeasureAggregation', vif, [ datasetMetadata ]);
      validatePasses('requireMeasureAggregation', vif, [ datasetMetadata ]);
    });

    describe('VIF with a measure aggregated by sum', function() {
      const vif = {
        format: { type: 'visualization_interchange_format', version: 2 },
        series: [
          {
            dataSource: {
              datasetUid: 'test-test',
              domain: 'example.com',
              dimension: { columnName: 'number', aggregationFunction: null },
              measure: { columnName: 'number2', aggregationFunction: 'sum' },
              type: 'socrata.soql',
              filters: []
            }
          }
        ]
      };
      const datasetMetadata = { columns: [
        { fieldName: 'number', renderTypeName: 'number' },
        { fieldName: 'number2', renderTypeName: 'number' }
      ]};

      validateFails('requireNoMeasureAggregation', vif, [ datasetMetadata ]);
      validatePasses('requireMeasureAggregation', vif, [ datasetMetadata ]);
    });

    describe('VIF with an unaggregated measure', function() {
      const vif = {
        format: { type: 'visualization_interchange_format', version: 2 },
        series: [
          {
            dataSource: {
              datasetUid: 'test-test',
              domain: 'example.com',
              dimension: { columnName: 'number', aggregationFunction: null },
              measure: { columnName: 'number2', aggregationFunction: null },
              type: 'socrata.soql',
              filters: []
            }
          }
        ]
      };
      const datasetMetadata = { columns: [
        { fieldName: 'number', renderTypeName: 'number' }
      ]};

      validatePasses('requireNoMeasureAggregation', vif, [ datasetMetadata ]);
      validateFails('requireMeasureAggregation', vif, [ datasetMetadata ]);
    });

    describe('VIF with series on different domains', function() {
      const vif = {
        format: { type: 'visualization_interchange_format', version: 2 },
        series: [
          {
            dataSource: {
              datasetUid: 'test-test',
              domain: 'example.com',
              dimension: { columnName: 'number', aggregationFunction: null },
              measure: { columnName: null, aggregationFunction: 'count' },
              type: 'socrata.soql',
              filters: []
            }
          },
          {
            dataSource: {
              datasetUid: 'test-test',
              domain: 'example2.com',
              dimension: { columnName: 'point', aggregationFunction: null },
              measure: { columnName: null, aggregationFunction: 'count' },
              type: 'socrata.soql',
              filters: []
            }
          }
        ]
      };
      const datasetMetadata = {
        columns: [
          { fieldName: 'number', renderTypeName: 'number' },
          { fieldName: 'point', renderTypeName: 'point' }
        ]
      };

      // all series use same dataset.
      const datasetMetadatas = [ datasetMetadata, datasetMetadata ];

      validatePasses('requireAtLeastOneSeries', vif, datasetMetadatas);
      validateFails('requireExactlyOneSeries', vif, datasetMetadatas);
      validateFails('requireAllSeriesFromSameDomain', vif, datasetMetadatas);
      validateFails('requireNoMeasureAggregation', vif, datasetMetadatas);
      validatePasses('requireMeasureAggregation', vif, datasetMetadatas);
      validateFails('requireCalendarDateDimension', vif, datasetMetadatas);
      validateFails('requirePointDimension', vif, datasetMetadatas);
      validateFails('requireNumericDimension', vif, datasetMetadatas);
    });
  });
});
