import _ from 'lodash';
import { assert } from 'chai';
import { CalculationTypeNames } from 'lib/constants';
import { calculateMeasure, calculateRateMeasure } from 'measureCalculator';

describe('measureCalculator', () => {
  const nullDataProvider = {};

  describe('calculateRateMeasure', () => {
    describe('denominator is zero', () => {
      it('sets dividingByZero to true in the response', async () => {
        const singularity = {};
        _.set(singularity, 'metric.type', 'rate');
        _.set(singularity, 'metric.arguments', {
          aggregationType: CalculationTypeNames.COUNT,
          fixedDenominator: '0'
        });

        const response = await calculateRateMeasure(singularity, nullDataProvider);
        assert.propertyVal(response, 'denominator', '0');
        assert.propertyVal(response, 'dividingByZero', true);
      });
    });

    describe('denominator is nonzero', () => {
      it('sets dividingByZero to false in the response', async () => {
        const nonZeroDenominator = {};
        _.set(nonZeroDenominator, 'metric.type', 'rate');
        _.set(nonZeroDenominator, 'metric.arguments', {
          aggregationType: CalculationTypeNames.COUNT,
          fixedDenominator: '10'
        });

        const response = await calculateRateMeasure(nonZeroDenominator, nullDataProvider);
        assert.propertyVal(response, 'dividingByZero', false);
      });
    });

    describe('fixed denominator', () => {
      describe('no aggregation', () => {
        const fixed = {};
        _.set(fixed, 'metric.type', 'rate');
        _.set(fixed, 'metric.arguments', {
          fixedDenominator: '123'
        });

        it('returns the fixed denominator in the response', async () => {
          const response = await calculateRateMeasure(fixed, nullDataProvider);
          assert.propertyVal(response, 'denominator', '123');
          assert.notProperty(response, 'numerator');
        });
      });

      describe('count aggregation', () => {
        const countFixed = {};
        _.set(countFixed, 'metric.type', 'rate');
        _.set(countFixed, 'metric.arguments', {
          aggregationType: CalculationTypeNames.COUNT,
          fixedDenominator: '10'
        });

        it('returns the fixed denominator in the response', async () => {
          const response = await calculateRateMeasure(countFixed, nullDataProvider);
          assert.propertyVal(response, 'denominator', '10');
          assert.notProperty(response, 'numerator');
        });

        it('computes numerator and divides by the fixed denominator', async () => {
          const countFixedWithNumerator = _.set(_.cloneDeep(countFixed),
            'metric.arguments.numeratorColumn',
            'numeratorCol'
          );
          // Rig the data provider to return 50 for row count, which will satisfy the
          // numerator query.
          const dataProvider = {
            getRowCount: async () => 50
          };
          const response = await calculateRateMeasure(countFixedWithNumerator, dataProvider);
          assert.propertyVal(response, 'result', '5');
        });
      });
      describe('sum aggregation', () => {
        const sumFixed = {};
        _.set(sumFixed, 'metric.type', 'rate');
        _.set(sumFixed, 'metric.arguments', {
          aggregationType: CalculationTypeNames.SUM,
          fixedDenominator: '20'
        });

        it('returns the fixed denominator in the response', async () => {
          const response = await calculateRateMeasure(sumFixed, nullDataProvider);
          assert.propertyVal(response, 'denominator', '20');
        });

        it('computes numerator and divides by the fixed denominator', async () => {
          const sumFixedWithNumerator = _.set(_.cloneDeep(sumFixed),
            'metric.arguments.numeratorColumn',
            'numeratorCol'
          );
          const dataProvider = {
            rawQuery: async () => [{
              '__measure_sum_alias__': '80' // Numerator
            }]
          };
          const response = await calculateRateMeasure(sumFixedWithNumerator, dataProvider);
          assert.propertyVal(response, 'result', '4'); // 80 / 20
        });
      });
    });

    describe('computed denominator', () => {
      describe('no aggregation', () => {
        const computed = {};
        _.set(computed, 'metric.type', 'rate');
        _.set(computed, 'metric.arguments', {
          denominatorColumn: 'denominatorCol'
        });

        it('returns an empty object', async () => {
          const response = await calculateRateMeasure(computed, nullDataProvider);
          assert.isEmpty(response);
        });
      });

      describe('count aggregation', () => {
        const countComputed = {};
        _.set(countComputed, 'metric.type', 'rate');
        _.set(countComputed, 'metric.arguments', {
          aggregationType: CalculationTypeNames.COUNT,
          denominatorColumn: 'denominatorCol'
        });

        it('returns the denominator in the response', async () => {
          const dataProvider = {
            getRowCount: async () => 40 // Denominator
          };
          const response = await calculateRateMeasure(countComputed, dataProvider);
          assert.propertyVal(response, 'denominator', '40');
          assert.notProperty(response, 'numerator');
        });

        it('computes numerator and divides by the denominator', async () => {
          const numeratorAndDenominator = _.set(_.cloneDeep(countComputed),
            'metric.arguments.numeratorColumn',
            'numeratorCol'
          );
          // This will differentiate the queries for mocking purposes.
          numeratorAndDenominator.metric.arguments.numeratorExcludeNullValues = true;
          const dataProvider = {
            rawQuery: async () => [{
              '__measure_count_alias__': '100' // Numerator
            }],
            getRowCount: async () => 50 // Denominator
          };
          const response = await calculateRateMeasure(numeratorAndDenominator, dataProvider);
          assert.propertyVal(response, 'result', '2');
        });
      });
      describe('sum aggregation', () => {
        const sumComputed = {};
        _.set(sumComputed, 'metric.type', 'rate');
        _.set(sumComputed, 'metric.arguments', {
          aggregationType: CalculationTypeNames.SUM,
          denominatorColumn: 'denominatorCol'
        });

        it('returns the denominator in the response', async () => {
          const dataProvider = {
            rawQuery: async () => [{
              '__measure_sum_alias__': '66' // Denominator
            }]
          };
          const response = await calculateRateMeasure(sumComputed, dataProvider);
          assert.propertyVal(response, 'denominator', '66');
          assert.notProperty(response, 'numerator');
        });

        it('computes numerator and divides by the denominator', async () => {
          const numeratorAndDenominator = _.set(_.cloneDeep(sumComputed),
            'metric.arguments.numeratorColumn',
            'numeratorCol'
          );
          // This will differentiate the queries for mocking purposes.
          numeratorAndDenominator.metric.arguments.numeratorExcludeNullValues = true;
          const dataProvider = {
            rawQuery: async (query) => {
              return query.indexOf('denominatorCol') < 0 ?
                [ { '__measure_sum_alias__': '300' } ] : // Numerator
                [ { '__measure_sum_alias__': '100' } ]; // Denominator
            }
          };
          const response = await calculateRateMeasure(numeratorAndDenominator, dataProvider);
          assert.propertyVal(response, 'result', '3');
          assert.propertyVal(response, 'numerator', '300');
          assert.propertyVal(response, 'denominator', '100');
        });
      });
    });
  });

  describe('incomplete metric setup', () => {
    describe('for count calculations', () => {
      let measure;

      beforeEach(() => {
        measure = {};
        _.set(measure, 'metric.dataSource.uid', 'test-test');
        _.set(measure, 'metric.arguments.column', 'some column name');
        _.set(measure, 'metric.type', 'count');
      });

      it('returns empty if dataSource uid is not set', async () => {
        _.unset(measure, 'metric.dataSource.uid');

        assert.isEmpty(await calculateMeasure(measure));
      });

      it('returns empty if column is not set', async () => {
        _.unset(measure, 'metric.arguments.column');

        assert.isEmpty(await calculateMeasure(measure));
      });
    });

    describe('for sum calculations', () => {
      let measure;

      beforeEach(() => {
        measure = {};
        _.set(measure, 'metric.type', 'sum');
        _.set(measure, 'metric.dataSource.uid', 'test-test');
        _.set(measure, 'metric.arguments.column', 'some column name');
      });

      it('returns empty if uid is not set', async () => {
        _.unset(measure, 'metric.dataSource.uid');

        assert.isEmpty(await calculateMeasure(measure));
      });

      it('returns empty if column is not set', async () => {
        _.unset(measure, 'metric.arguments.column');

        assert.isEmpty(await calculateMeasure(measure));
      });
    });

    describe('for recent_value calculations', () => {
      let measure;

      beforeEach(() => {
        measure = {};
        _.set(measure, 'metric.type', 'recent_value');
        _.set(measure, 'metric.dataSource.uid', 'test-test');
        _.set(measure, 'metric.arguments.valueColumn', 'foos');
        _.set(measure, 'metric.arguments.dateColumn', 'bars');
      });

      it('returns empty if uid is not set', async () => {
        _.unset(measure, 'metric.dataSource.uid');

        assert.isEmpty(await calculateMeasure(measure));
      });

      it('returns empty if valueColumn is not set', async () => {
        _.unset(measure, 'metric.arguments.valueColumn');

        assert.isEmpty(await calculateMeasure(measure));
      });

      it('returns empty if dateColumn is not set', async () => {
        _.unset(measure, 'metric.arguments.dateColumn');

        assert.isEmpty(await calculateMeasure(measure));
      });
    });

    describe('for rate calculations', () => {
      let measure;

      beforeEach(() => {
        measure = {};
        _.set(measure, 'metric.type', 'rate');
        _.set(measure, 'metric.dataSource.uid', 'test-test');
        _.set(measure, 'metric.arguments.aggregationType', 'sum');
        _.set(measure, 'metric.arguments.numeratorColumn', 'columnA');
        _.set(measure, 'metric.arguments.denominatorColumn', 'columnB');
      });

      it('returns empty if uid is not set', async () => {
        _.unset(measure, 'metric.dataSource.uid');

        assert.isEmpty(await calculateMeasure(measure));
      });

      it('returns empty if neither aggregationType nor fixedDenominator is set', async () => {
        _.unset(measure, 'metric.arguments.aggregationType');
        assert.isEmpty(await calculateMeasure(measure));
      });
    });
  });
});