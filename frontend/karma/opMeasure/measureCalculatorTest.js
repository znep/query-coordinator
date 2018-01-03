import _ from 'lodash';
import { assert } from 'chai';
import { CalculationTypeNames } from 'lib/constants';
import { calculateMeasure, calculateRateMeasure, isColumnUsableWithMeasureArgument } from 'measureCalculator';

describe('measureCalculator', () => {
  const nullDataProvider = {};

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
    });

    describe('sum measure', () => {
      scenario(dateCol, sumMeasure, 'valueColumn', false);
      scenario(numberCol, sumMeasure, 'valueColumn', true);
      scenario(moneyCol, sumMeasure, 'valueColumn', true);
      scenario(textCol, sumMeasure, 'valueColumn', false);
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
        const singularity = {};
        _.set(singularity, 'metricConfig.type', 'rate');
        _.set(singularity, 'metricConfig.arguments', {
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
        _.set(nonZeroDenominator, 'metricConfig.type', 'rate');
        _.set(nonZeroDenominator, 'metricConfig.arguments', {
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
        _.set(fixed, 'metricConfig.type', 'rate');
        _.set(fixed, 'metricConfig.arguments', {
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
        _.set(countFixed, 'metricConfig.type', 'rate');
        _.set(countFixed, 'metricConfig.arguments', {
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
            'metricConfig.arguments.numeratorColumn',
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
          calculateRateMeasure(countWithCondition, dataProvider);
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
          assert.throws(() => calculateRateMeasure(sumWithExcludeInDenominator, dataProvider));
        });

        it('returns the fixed denominator in the response', async () => {
          const response = await calculateRateMeasure(sumFixed, nullDataProvider);
          assert.propertyVal(response, 'denominator', '20');
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
          const response = await calculateRateMeasure(sumFixedWithNumerator, dataProvider);
          assert.propertyVal(response, 'result', '4'); // 80 / 20
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

        it('returns an empty object', async () => {
          const response = await calculateRateMeasure(computed, nullDataProvider);
          assert.isEmpty(response);
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
            getRowCount: async () => 40 // Denominator
          };
          const response = await calculateRateMeasure(countComputed, dataProvider);
          assert.propertyVal(response, 'denominator', '40');
          assert.notProperty(response, 'numerator');
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
          const response = await calculateRateMeasure(sumComputed, dataProvider);
          assert.propertyVal(response, 'denominator', '66');
          assert.notProperty(response, 'numerator');
        });

        it('computes numerator and divides by the denominator', async () => {
          const numeratorAndDenominator = _.set(_.cloneDeep(sumComputed),
            'metricConfig.arguments.numeratorColumn',
            'numeratorCol'
          );
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
                assert.notInclude(query, 'where');
                done();
              }
            }
          };
          calculateRateMeasure(sumWithNoopCondition, dataProvider);
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
          calculateRateMeasure(sumWithCondition, dataProvider);
        });
      });
    });
  });

  describe('incomplete metric setup', () => {
    describe('for count calculations', () => {
      let measure;

      beforeEach(() => {
        measure = {};
        _.set(measure, 'metricConfig.dataSource.uid', 'test-test');
        _.set(measure, 'metricConfig.arguments.column', 'some column name');
        _.set(measure, 'metricConfig.type', 'count');
      });

      it('returns empty if dataSource uid is not set', async () => {
        _.unset(measure, 'metricConfig.dataSource.uid');

        assert.isEmpty(await calculateMeasure(measure));
      });

      it('returns empty if column is not set', async () => {
        _.unset(measure, 'metricConfig.arguments.column');

        assert.isEmpty(await calculateMeasure(measure));
      });
    });

    describe('for sum calculations', () => {
      let measure;

      beforeEach(() => {
        measure = {};
        _.set(measure, 'metricConfig.type', 'sum');
        _.set(measure, 'metricConfig.dataSource.uid', 'test-test');
        _.set(measure, 'metricConfig.arguments.column', 'some column name');
      });

      it('returns empty if uid is not set', async () => {
        _.unset(measure, 'metricConfig.dataSource.uid');

        assert.isEmpty(await calculateMeasure(measure));
      });

      it('returns empty if column is not set', async () => {
        _.unset(measure, 'metricConfig.arguments.column');

        assert.isEmpty(await calculateMeasure(measure));
      });
    });

    describe('for recent value calculations', () => {
      let measure;

      beforeEach(() => {
        measure = {};
        _.set(measure, 'metricConfig.type', 'recent');
        _.set(measure, 'metricConfig.dataSource.uid', 'test-test');
        _.set(measure, 'metricConfig.arguments.valueColumn', 'foos');
        _.set(measure, 'metricConfig.arguments.dateColumn', 'bars');
      });

      it('returns empty if uid is not set', async () => {
        _.unset(measure, 'metricConfig.dataSource.uid');

        assert.isEmpty(await calculateMeasure(measure));
      });

      it('returns empty if valueColumn is not set', async () => {
        _.unset(measure, 'metricConfig.arguments.valueColumn');

        assert.isEmpty(await calculateMeasure(measure));
      });

      it('returns empty if dateColumn is not set', async () => {
        _.unset(measure, 'metricConfig.arguments.dateColumn');

        assert.isEmpty(await calculateMeasure(measure));
      });
    });

    describe('for rate calculations', () => {
      let measure;

      beforeEach(() => {
        measure = {};
        _.set(measure, 'metricConfig.type', 'rate');
        _.set(measure, 'metricConfig.dataSource.uid', 'test-test');
        _.set(measure, 'metricConfig.arguments.aggregationType', 'sum');
        _.set(measure, 'metricConfig.arguments.numeratorColumn', 'columnA');
        _.set(measure, 'metricConfig.arguments.denominatorColumn', 'columnB');
      });

      it('returns empty if uid is not set', async () => {
        _.unset(measure, 'metricConfig.dataSource.uid');

        assert.isEmpty(await calculateMeasure(measure));
      });

      it('returns empty if neither aggregationType nor fixedDenominator is set', async () => {
        _.unset(measure, 'metricConfig.arguments.aggregationType');
        assert.isEmpty(await calculateMeasure(measure));
      });
    });
  });
});
