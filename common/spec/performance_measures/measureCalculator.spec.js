import _ from 'lodash';
import moment from 'moment';
import { assert } from 'chai';
import { CalculationTypeNames } from 'common/performance_measures/lib/constants';
import DateRange from 'common/performance_measures/lib/dateRange';
import {
  calculateMeasure,
  calculateRateMeasure,
  isColumnUsableWithMeasureArgument
} from 'common/performance_measures/measureCalculator';

describe('measureCalculator', () => {
  const sampleDateRange = new DateRange(moment('2018-01-10T00:21:27.375Z'), 'day');
  const fakeDateRangeWhereClause = 'MOCK WHERE CLAUSE';
  const nullDataProvider = {};
  const rowCountDataProvider = { rawQuery: async () => [{ __measure_count_alias__: 50 }] };

  describe('isColumnUsableWithMeasureArgument', () => {
    const countMeasure = _.set({}, 'metricConfig.type', CalculationTypeNames.COUNT);
    const sumMeasure = _.set({}, 'metricConfig.type', CalculationTypeNames.SUM);
    const countRateMeasure = _.set({}, 'metricConfig.type', CalculationTypeNames.RATE);
    _.set(countRateMeasure, 'metricConfig.arguments.aggregationType', 'count');
    const sumRateMeasure = _.set({}, 'metricConfig.type', CalculationTypeNames.RATE);
    _.set(sumRateMeasure, 'metricConfig.arguments.aggregationType', 'sum');
    const recentValueMeasure = _.set({}, 'metricConfig.type', CalculationTypeNames.RECENT);

    const dateCol = { renderTypeName: 'calendar_date' };
    const numberCol = { renderTypeName: 'number' };
    const moneyCol = { renderTypeName: 'money' };
    const textCol = { renderTypeName: 'text' };

    const scenario = (column, measure, argument, expectedValue) => {
      describe(`measure argument: ${argument}`, () => {
        it(`returns ${expectedValue} for ${column.renderTypeName}`, () => {
          assert.equal(
            isColumnUsableWithMeasureArgument(column, measure, argument),
            expectedValue
          );
        });
      });
    };

    describe('count measure', () => {
      scenario(dateCol, countMeasure, 'valueColumn', true);
      scenario(numberCol, countMeasure, 'valueColumn', true);
      scenario(moneyCol, countMeasure, 'valueColumn', true);
      scenario(textCol, countMeasure, 'valueColumn', true);

      scenario(dateCol, countMeasure, 'dateColumn', true);
      scenario(numberCol, countMeasure, 'dateColumn', false);
      scenario(moneyCol, countMeasure, 'dateColumn', false);
      scenario(textCol, countMeasure, 'dateColumn', false);
    });

    describe('sum measure', () => {
      scenario(dateCol, sumMeasure, 'valueColumn', false);
      scenario(numberCol, sumMeasure, 'valueColumn', true);
      scenario(moneyCol, sumMeasure, 'valueColumn', true);
      scenario(textCol, sumMeasure, 'valueColumn', false);

      scenario(dateCol, sumMeasure, 'dateColumn', true);
      scenario(numberCol, sumMeasure, 'dateColumn', false);
      scenario(moneyCol, sumMeasure, 'dateColumn', false);
      scenario(textCol, sumMeasure, 'dateColumn', false);
    });

    describe('count rate measure', () => {
      scenario(dateCol, countRateMeasure, 'numeratorColumn', true);
      scenario(numberCol, countRateMeasure, 'numeratorColumn', true);
      scenario(moneyCol, countRateMeasure, 'numeratorColumn', true);
      scenario(textCol, countRateMeasure, 'numeratorColumn', true);

      scenario(dateCol, countRateMeasure, 'denominatorColumn', true);
      scenario(numberCol, countRateMeasure, 'denominatorColumn', true);
      scenario(moneyCol, countRateMeasure, 'denominatorColumn', true);
      scenario(textCol, countRateMeasure, 'denominatorColumn', true);

      scenario(dateCol, countRateMeasure, 'dateColumn', true);
      scenario(numberCol, countRateMeasure, 'dateColumn', false);
      scenario(moneyCol, countRateMeasure, 'dateColumn', false);
      scenario(textCol, countRateMeasure, 'dateColumn', false);
    });

    describe('sum rate measure', () => {
      scenario(dateCol, sumRateMeasure, 'numeratorColumn', false);
      scenario(numberCol, sumRateMeasure, 'numeratorColumn', true);
      scenario(moneyCol, sumRateMeasure, 'numeratorColumn', true);
      scenario(textCol, sumRateMeasure, 'numeratorColumn', false);

      scenario(dateCol, sumRateMeasure, 'denominatorColumn', false);
      scenario(numberCol, sumRateMeasure, 'denominatorColumn', true);
      scenario(moneyCol, sumRateMeasure, 'denominatorColumn', true);
      scenario(textCol, sumRateMeasure, 'denominatorColumn', false);

      scenario(dateCol, sumRateMeasure, 'dateColumn', true);
      scenario(numberCol, sumRateMeasure, 'dateColumn', false);
      scenario(moneyCol, sumRateMeasure, 'dateColumn', false);
      scenario(textCol, sumRateMeasure, 'dateColumn', false);
    });

    describe('recent value measure', () => {
      scenario(dateCol, recentValueMeasure, 'valueColumn', false);
      scenario(numberCol, recentValueMeasure, 'valueColumn', true);
      scenario(moneyCol, recentValueMeasure, 'valueColumn', true);
      scenario(textCol, recentValueMeasure, 'valueColumn', false);

      scenario(dateCol, recentValueMeasure, 'dateColumn', true);
      scenario(numberCol, recentValueMeasure, 'dateColumn', false);
      scenario(moneyCol, recentValueMeasure, 'dateColumn', false);
      scenario(textCol, recentValueMeasure, 'dateColumn', false);
    });

  });

  describe('calculateRateMeasure', () => {
    describe('denominator is zero', () => {
      it('sets dividingByZero to true in the response', async () => {
        const singularityMeasure = {
          metricConfig: {
            type: 'rate',
            arguments: {
              aggregationType: CalculationTypeNames.COUNT,
              numeratorColumn: 'numeratorCol',
              fixedDenominator: '0'
            }
          },
          dataSourceLensUid: 'test-test'
        };

        const { result, errors } = await calculateRateMeasure(
          {}, singularityMeasure, fakeDateRangeWhereClause, rowCountDataProvider
        );
        assert.propertyVal(result, 'denominator', '0');
        assert.propertyVal(errors, 'dividingByZero', true);
      });
    });

    describe('denominator is nonzero', () => {
      it('sets dividingByZero to false in the response', async () => {
        const nonZeroDenominatorMeasure = {
          metricConfig: {
            type: 'rate',
            arguments: {
              aggregationType: CalculationTypeNames.COUNT,
              numeratorColumn: 'numeratorCol',
              fixedDenominator: '10'
            }
          }
        };

        const { errors } = await calculateRateMeasure(
          {}, nonZeroDenominatorMeasure, fakeDateRangeWhereClause, rowCountDataProvider
        );
        assert.propertyVal(errors, 'dividingByZero', false);
      });
    });

    describe('fixed denominator', () => {
      describe('no aggregation', () => {
        const fixed = {};
        _.set(fixed, 'metricConfig.type', 'rate');
        _.set(fixed, 'metricConfig.arguments', {
          fixedDenominator: '123'
        });

        it('returns the fixed denominator in the response', async () => {
          const { result } = await calculateRateMeasure(
            {}, fixed, fakeDateRangeWhereClause, nullDataProvider
          );
          assert.propertyVal(result, 'denominator', '123');
          assert.notProperty(result, 'numerator');
        });
      });

      describe('count aggregation', () => {
        const countFixed = {};
        _.set(countFixed, 'metricConfig.type', 'rate');
        _.set(countFixed, 'metricConfig.arguments', {
          aggregationType: CalculationTypeNames.COUNT,
          fixedDenominator: '10'
        });

        it('returns the fixed denominator in the response', async () => {
          const { result } = await calculateRateMeasure(
            {}, countFixed, fakeDateRangeWhereClause, nullDataProvider
          );
          assert.propertyVal(result, 'denominator', '10');
          assert.notProperty(result, 'numerator');
        });

        it('computes numerator and divides by the fixed denominator', async () => {
          const countFixedWithNumerator = _.set(_.cloneDeep(countFixed),
            'metricConfig.arguments.numeratorColumn',
            'numeratorCol'
          );

          const { result } = await calculateRateMeasure(
            {}, countFixedWithNumerator, fakeDateRangeWhereClause, rowCountDataProvider
          );
          assert.propertyVal(result, 'value', '5');
        });

        it('includes column condition in query', (done) => {
          const countWithCondition = _.set(_.cloneDeep(countFixed),
            'metricConfig.arguments.numeratorColumn',
            'numeratorCol'
          );
          _.set(countWithCondition,
            'metricConfig.arguments.numeratorColumnCondition',
            { function: 'valueRange', arguments: { start: 3, end: 5 } }
          );

          const dataProvider = {
            rawQuery: (query) => {
              assert.include(query, '(`numeratorCol` >= 3 AND `numeratorCol` < 5)');
              done();
            }
          };
          calculateRateMeasure(
            {}, countWithCondition, fakeDateRangeWhereClause, dataProvider
          );
        });
      });

      describe('sum aggregation', () => {
        const sumFixed = {};
        _.set(sumFixed, 'metricConfig.type', 'rate');
        _.set(sumFixed, 'metricConfig.arguments', {
          aggregationType: CalculationTypeNames.SUM,
          fixedDenominator: '20'
        });

        it('throws if nulls are excluded', () => {
          const sumWithExcludeInDenominator = _.set(_.cloneDeep(sumFixed),
            'metricConfig.arguments.denominatorIncludeNullValues',
            false
          );
          return calculateRateMeasure({}, sumWithExcludeInDenominator, fakeDateRangeWhereClause, {}).
            then((resolution) => {
              throw new Error(`Expected rejection, but resolved with: ${resolution}`);
            }).
            catch((error) => {
              assert.equal(
                error.message,
                'Excluding null values from non-count Rate measure numerator is nonsensical'
              );
            });
        });

        it('returns the fixed denominator in the response', async () => {
          const { result } = await calculateRateMeasure(
            {}, sumFixed, fakeDateRangeWhereClause, nullDataProvider
          );

          assert.propertyVal(result, 'denominator', '20');
        });

        it('computes numerator and divides by the fixed denominator', async () => {
          const sumFixedWithNumerator = _.set(_.cloneDeep(sumFixed),
            'metricConfig.arguments.numeratorColumn',
            'numeratorCol'
          );
          const dataProvider = {
            rawQuery: async () => [{
              '__measure_sum_alias__': '80' // Numerator
            }]
          };
          const { result } = await calculateRateMeasure(
            {}, sumFixedWithNumerator, fakeDateRangeWhereClause, dataProvider
          );
          assert.propertyVal(result, 'value', '4'); // 80 / 20
        });
      });
    });

    describe('computed denominator', () => {
      describe('no aggregation', () => {
        const computed = {};
        _.set(computed, 'metricConfig.type', 'rate');
        _.set(computed, 'metricConfig.arguments', {
          denominatorColumn: 'denominatorCol'
        });

        it('sets calculationNotConfigured', async () => {
          const { errors } = await calculateRateMeasure(
            {}, computed, fakeDateRangeWhereClause, nullDataProvider
          );
          assert.propertyVal(errors, 'calculationNotConfigured', true);
        });
      });

      describe('count aggregation', () => {
        const countComputed = {};
        _.set(countComputed, 'metricConfig.type', 'rate');
        _.set(countComputed, 'metricConfig.arguments', {
          aggregationType: CalculationTypeNames.COUNT,
          denominatorColumn: 'denominatorCol'
        });

        it('returns the denominator in the response', async () => {
          const dataProvider = {
            rawQuery: async () => [{ __measure_count_alias__: 40 }] // Denominator
          };
          const { result } = await calculateRateMeasure(
            {}, countComputed, fakeDateRangeWhereClause, dataProvider
          );
          assert.propertyVal(result, 'denominator', '40');
          assert.notProperty(result, 'numerator');
        });

        it('computes numerator and divides by the denominator', async () => {
          const numeratorAndDenominator = _.set(_.cloneDeep(countComputed),
            'metricConfig.arguments.numeratorColumn',
            'numeratorCol'
          );
          // This will differentiate the queries for mocking purposes.
          _.set(numeratorAndDenominator,
            'metricConfig.arguments.numeratorColumnCondition',
            { function: 'valueRange', arguments: { start: 3, end: 5 } }
          );
          const dataProvider = {
            rawQuery: async (query) => {
              return query.indexOf('denominatorCol') < 0 ?
                [{ '__measure_count_alias__': '100' }] : // Numerator
                [{ '__measure_count_alias__': '50' }]; // Denominator
            }
          };
          const { result } = await calculateRateMeasure(
            {}, numeratorAndDenominator, fakeDateRangeWhereClause, dataProvider
          );
          assert.propertyVal(result, 'value', '2');
        });
      });

      describe('sum aggregation', () => {
        const sumComputed = {};
        _.set(sumComputed, 'metricConfig.type', 'rate');
        _.set(sumComputed, 'metricConfig.arguments', {
          aggregationType: CalculationTypeNames.SUM,
          denominatorColumn: 'denominatorCol'
        });

        it('returns the denominator in the response', async () => {
          const dataProvider = {
            rawQuery: async () => [{
              '__measure_sum_alias__': '66' // Denominator
            }]
          };
          const { result } = await calculateRateMeasure(
            {}, sumComputed, fakeDateRangeWhereClause, dataProvider
          );
          assert.propertyVal(result, 'denominator', '66');
          assert.notProperty(result, 'numerator');
        });

        it('computes numerator and divides by the denominator', async () => {
          const numeratorAndDenominator = _.set(_.cloneDeep(sumComputed),
            'metricConfig.arguments.numeratorColumn',
            'numeratorCol'
          );
          const dataProvider = {
            rawQuery: async (query) => {
              return query.indexOf('denominatorCol') < 0 ?
                [{ '__measure_sum_alias__': '300' }] : // Numerator
                [{ '__measure_sum_alias__': '100' }]; // Denominator
            }
          };
          const { result } = await calculateRateMeasure(
            {}, numeratorAndDenominator, fakeDateRangeWhereClause, dataProvider
          );
          assert.propertyVal(result, 'value', '3');
          assert.propertyVal(result, 'numerator', '300');
          assert.propertyVal(result, 'denominator', '100');
        });

        it('includes no column condition in query (noop filter)', (done) => {
          const sumWithNoopCondition = _.set(_.cloneDeep(sumComputed),
            'metricConfig.arguments.numeratorColumn',
            'numeratorCol'
          );
          _.set(sumWithNoopCondition,
            'metricConfig.arguments.numeratorColumnCondition',
            { function: 'noop', arguments: null }
          );

          const dataProvider = {
            rawQuery: (query) => {
              if (query.indexOf('numeratorCol') >= 0) {
                assert.notInclude(query.toLowerCase(), 'null');
                done();
              }
            }
          };
          calculateRateMeasure(
            {}, sumWithNoopCondition, fakeDateRangeWhereClause, dataProvider
          );
        });

        it('includes column condition in query (real filter)', (done) => {
          const sumWithCondition = _.set(_.cloneDeep(sumComputed),
            'metricConfig.arguments.numeratorColumn',
            'numeratorCol'
          );
          _.set(sumWithCondition,
            'metricConfig.arguments.numeratorColumnCondition',
            { function: 'valueRange', arguments: { start: 3, end: 5 } }
          );

          const dataProvider = {
            rawQuery: (query) => {
              if (query.indexOf('numeratorCol') >= 0) {
                assert.include(query, 'where');
                assert.include(query, '(`numeratorCol` >= 3 AND `numeratorCol` < 5)');
                done();
              }
            }
          };
          calculateRateMeasure(
            {}, sumWithCondition, fakeDateRangeWhereClause, dataProvider
          );
        });
      });
    });
  });

  describe('incomplete metric setup', () => {
    describe('for blank measures', () => {
      it('should report dataSourceNotConfigured', async () => {
        const { errors } = await calculateMeasure({}, sampleDateRange);
        // Other errors will be reported, but this is the only one we care about.
        assert.propertyVal(errors, 'dataSourceNotConfigured', true);
      });
    });

    describe('for measures with a blank metricConfig', () => {
      it('should report dataSourceNotConfigured', async () => {
        const { errors } = await calculateMeasure({ metricConfig: {} }, sampleDateRange);
        // Other errors will be reported, but this is the only one we care about.
        assert.propertyVal(errors, 'dataSourceNotConfigured', true);
      });
    });

    describe('for measures with a valid data source and reporting period but no calculation type', () => {
      let measure;

      beforeEach(() => {
        measure = {};
        _.set(measure, 'metricConfig.reportingPeriod', {
          type: 'open',
          size: 'year',
          startDate: '1988-01-10T08:00:00.000Z'
        });
        _.set(measure, 'dataSourceLensUid', 'test-test');
        _.set(measure, 'metricConfig.arguments.column', 'some column name');
        _.set(measure, 'metricConfig.dateColumn', 'someDateColumn');
      });

      it('should report calculationNotConfigured', async () => {
        const { errors } = await calculateMeasure(measure, sampleDateRange);
        assert.propertyVal(errors, 'calculationNotConfigured', true);
      });
    });

    describe('for count calculations', () => {
      let measure;

      beforeEach(() => {
        measure = {};
        _.set(measure, 'metricConfig.reportingPeriod', {
          type: 'open',
          size: 'year',
          startDate: '1988-01-10T08:00:00.000Z'
        });
        _.set(measure, 'dataSourceLensUid', 'test-test');
        _.set(measure, 'metricConfig.arguments.column', 'some column name');
        _.set(measure, 'metricConfig.dateColumn', 'someDateColumn');
        _.set(measure, 'metricConfig.type', 'count');
      });

      it('sets dataSourceNotConfigured if dataSource uid is not set', async () => {
        _.unset(measure, 'dataSourceLensUid');

        const { errors } = await calculateMeasure(measure, sampleDateRange);
        assert.propertyVal(errors, 'dataSourceNotConfigured', true);
      });

      it('sets calculationNotConfigured if column is not set', async () => {
        _.unset(measure, 'metricConfig.arguments.column');

        const { errors } = await calculateMeasure(measure, sampleDateRange);
        assert.propertyVal(errors, 'calculationNotConfigured', true);
      });

      it('sets calculationNotConfigured if dateColumn is not set', async () => {
        _.unset(measure, 'metricConfig.dateColumn');

        const { errors } = await calculateMeasure(measure, sampleDateRange);
        assert.propertyVal(errors, 'calculationNotConfigured', true);
      });

      it('sets noReportingPeriodConfigured if reportingPeriod is not set', async () => {
        _.unset(measure, 'metricConfig.reportingPeriod');

        const { errors } = await calculateMeasure(measure, undefined);
        assert.propertyVal(errors, 'noReportingPeriodConfigured', true);
      });

      it('does not set calculationNotConfigured if reportingPeriod is not set', async () => {
        const { errors } = await calculateMeasure(measure, undefined);
        assert.propertyVal(errors, 'calculationNotConfigured', false);
      });
    });

    describe('for sum calculations', () => {
      let measure;

      beforeEach(() => {
        measure = {};
        _.set(measure, 'metricConfig.reportingPeriod', {
          type: 'open',
          size: 'year',
          startDate: '1988-01-10T08:00:00.000Z'
        });
        _.set(measure, 'metricConfig.type', 'sum');
        _.set(measure, 'dataSourceLensUid', 'test-test');
        _.set(measure, 'metricConfig.arguments.column', 'some column name');
        _.set(measure, 'metricConfig.dateColumn', 'someDateColumn');
      });

      it('sets dataSourceNotConfigured if dataSource uid is not set', async () => {
        _.unset(measure, 'dataSourceLensUid');

        const { errors } = await calculateMeasure(measure, sampleDateRange);
        assert.propertyVal(errors, 'dataSourceNotConfigured', true);
      });

      it('sets calculationNotConfigured if column is not set', async () => {
        _.unset(measure, 'metricConfig.arguments.column');

        const { errors } = await calculateMeasure(measure, sampleDateRange);
        assert.propertyVal(errors, 'calculationNotConfigured', true);
      });

      it('sets calculationNotConfigured if dateColumn is not set', async () => {
        _.unset(measure, 'metricConfig.dateColumn');

        const { errors } = await calculateMeasure(measure, sampleDateRange);
        assert.propertyVal(errors, 'calculationNotConfigured', true);
      });

      it('sets noReportingPeriodConfigured if reportingPeriod is not set', async () => {
        _.unset(measure, 'metricConfig.reportingPeriod');

        const { errors } = await calculateMeasure(measure, undefined);
        assert.propertyVal(errors, 'noReportingPeriodConfigured', true);
      });

      it('does not set calculationNotConfigured if reportingPeriod is not set', async () => {
        _.unset(measure, 'metricConfig.reportingPeriod');

        const { errors } = await calculateMeasure(measure, undefined);
        assert.propertyVal(errors, 'calculationNotConfigured', false);
      });
    });

    describe('for recent value calculations', () => {
      let measure;

      beforeEach(() => {
        measure = {};
        _.set(measure, 'metricConfig.reportingPeriod', {
          type: 'open',
          size: 'year',
          startDate: '1988-01-10T08:00:00.000Z'
        });
        _.set(measure, 'metricConfig.type', 'recent');
        _.set(measure, 'dataSourceLensUid', 'test-test');
        _.set(measure, 'metricConfig.arguments.valueColumn', 'foos');
        _.set(measure, 'metricConfig.dateColumn', 'bars');
      });

      it('sets dataSourceNotConfigured if dataSource uid is not set', async () => {
        _.unset(measure, 'dataSourceLensUid');
        const { errors } = await calculateMeasure(measure, sampleDateRange);
        assert.propertyVal(errors, 'dataSourceNotConfigured', true);
      });

      it('sets calculationNotConfigured if valueColumn is not set', async () => {
        _.unset(measure, 'metricConfig.arguments.valueColumn');

        const { errors } = await calculateMeasure(measure, sampleDateRange);
        assert.propertyVal(errors, 'calculationNotConfigured', true);
      });

      it('sets calculationNotConfigured if dateColumn is not set', async () => {
        _.unset(measure, 'metricConfig.dateColumn');

        const { errors } = await calculateMeasure(measure, sampleDateRange);
        assert.propertyVal(errors, 'calculationNotConfigured', true);
      });

      it('sets noReportingPeriodConfigured if reportingPeriod is not set', async () => {
        _.unset(measure, 'metricConfig.reportingPeriod');

        const { errors } = await calculateMeasure(measure, undefined);
        assert.propertyVal(errors, 'noReportingPeriodConfigured', true);
      });

      it('does not set calculationNotConfigured if reportingPeriod is not set', async () => {
        _.unset(measure, 'metricConfig.reportingPeriod');

        const { errors } = await calculateMeasure(measure, undefined);
        assert.propertyVal(errors, 'calculationNotConfigured', false);
      });
    });

    describe('for rate calculations', () => {
      let measure;

      beforeEach(() => {
        measure = {};
        _.set(measure, 'metricConfig.reportingPeriod', {
          type: 'open',
          size: 'year',
          startDate: '1988-01-10T08:00:00.000Z'
        });
        _.set(measure, 'metricConfig.type', 'rate');
        _.set(measure, 'dataSourceLensUid', 'test-test');
        _.set(measure, 'metricConfig.arguments.aggregationType', 'sum');
        _.set(measure, 'metricConfig.arguments.numeratorColumn', 'columnA');
        _.set(measure, 'metricConfig.arguments.denominatorColumn', 'columnB');
        _.set(measure, 'metricConfig.dateColumn', 'someDateColumn');
      });

      it('sets dataSourceNotConfigured if dataSource uid is not set', async () => {
        _.unset(measure, 'dataSourceLensUid');

        const { errors } = await calculateMeasure(measure, sampleDateRange);
        assert.propertyVal(errors, 'dataSourceNotConfigured', true);
      });

      it('sets calculationNotConfigured if neither aggregationType nor fixedDenominator is set', async () => {
        _.unset(measure, 'metricConfig.arguments.aggregationType');

        const { errors } = await calculateMeasure(measure, sampleDateRange);
        assert.propertyVal(errors, 'calculationNotConfigured', true);
      });

      it('sets calculationNotConfigured if dateColumn is not set', async () => {
        _.unset(measure, 'metricConfig.dateColumn');

        const { errors } = await calculateMeasure(measure, sampleDateRange);
        assert.propertyVal(errors, 'calculationNotConfigured', true);
      });

      it('sets noReportingPeriodConfigured if reportingPeriod is not set', async () => {
        _.unset(measure, 'metricConfig.reportingPeriod');

        const { errors } = await calculateMeasure(measure, undefined);
        assert.propertyVal(errors, 'noReportingPeriodConfigured', true);
      });

      it('does not set calculationNotConfigured if reportingPeriod is not set', async () => {
        _.unset(measure, 'metricConfig.reportingPeriod');

        const { errors } = await calculateMeasure(measure, undefined);
        assert.propertyVal(errors, 'calculationNotConfigured', false);
      });
    });
  });
});
