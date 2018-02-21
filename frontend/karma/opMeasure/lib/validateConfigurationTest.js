import _ from 'lodash';
import { assert } from 'chai';

import validateConfiguration from 'opMeasure/lib/validateConfiguration';

describe('validateConfiguration', () => {
  const validViewMetadata = {
    columns: [
      { name: 'Some Numbers', fieldName: 'some_numbers', dataTypeName: 'number' },
      { name: 'Some Text', fieldName: 'some_text', dataTypeName: 'text' },
      { name: 'Some Dates', fieldName: 'some_dates', dataTypeName: 'calendar_date' }
    ]
  };
  const validColumns = validViewMetadata.columns;
  const validMetric = {
    arguments: {
      column: 'some_text',
      includeNullValues: true
    },
    dateColumn: 'some_dates',
    type: 'count',
    reportingPeriod: {
      startDate: '3001-01-01',
      type: 'closed',
      size: 'week'
    }
  };

  describe('when there are no validation problems', () => {
    it('sets every key to false', () => {
      const validation = validateConfiguration(validMetric, validViewMetadata, validColumns);

      const groups = ['calculation', 'dataSource', 'reportingPeriod'];
      assert.hasAllKeys(validation, groups);

      _.each(groups, (group) => {
        assert.isNotEmpty(validation[group]);
        assert.isFalse(_.some(validation[group]));
      });
    });
  });

  describe('calculation group', () => {
    let metric;

    describe('(count type)', () => {
      beforeEach(() => {
        metric = _.extend({}, validMetric, {
          type: 'count'
        });
      });

      it('detects missing date reference column', () => {
        _.extend(metric, {
          dateColumn: null
        });

        const validation = validateConfiguration(metric, validViewMetadata, validColumns);

        assert.isTrue(validation.calculation.noReferenceDateColumn);
      });

      it('detects missing count column', () => {
        _.extend(metric, {
          arguments: {
            column: null
          }
        });

        const validation = validateConfiguration(metric, validViewMetadata, validColumns);

        assert.isTrue(validation.calculation.noCountColumn);
      });
    });

    describe('(sum type)', () => {
      beforeEach(() => {
        metric = _.extend({}, validMetric, {
          type: 'sum'
        });
      });

      it('detects missing date reference column', () => {
        _.extend(metric, {
          dateColumn: null
        });

        const validation = validateConfiguration(metric, validViewMetadata, validColumns);

        assert.isTrue(validation.calculation.noReferenceDateColumn);
      });

      it('detects missing sum column', () => {
        _.extend(metric, {
          arguments: {
            column: null
          }
        });

        const validation = validateConfiguration(metric, validViewMetadata, validColumns);

        assert.isTrue(validation.calculation.noSumColumn);
      });

      it('detects lack of numeric column', () => {
        const columnsWithoutNumeric = validColumns.slice(1);

        const validation = validateConfiguration(metric, validViewMetadata, columnsWithoutNumeric);

        assert.isTrue(validation.calculation.noNumericColumn);
      });
    });

    describe('(recent value type)', () => {
      beforeEach(() => {
        metric = _.extend({}, validMetric, {
          type: 'recent'
        });
      });

      it('detects missing date reference column', () => {
        _.extend(metric, {
          dateColumn: null
        });

        const validation = validateConfiguration(metric, validViewMetadata, validColumns);

        assert.isTrue(validation.calculation.noReferenceDateColumn);
      });

      it('detects missing value column', () => {
        _.extend(metric, {
          arguments: {
            valueColumn: null
          }
        });

        const validation = validateConfiguration(metric, validViewMetadata, validColumns);

        assert.isTrue(validation.calculation.noRecentValueColumn);
      });

      it('detects lack of numeric column', () => {
        const columnsWithoutNumeric = validColumns.slice(1);

        const validation = validateConfiguration(metric, validViewMetadata, columnsWithoutNumeric);

        assert.isTrue(validation.calculation.noNumericColumn);
      });
    });

    describe('(rate type)', () => {
      beforeEach(() => {
        metric = _.extend({}, validMetric, {
          type: 'rate'
        });
      });

      it('detects missing aggregation', () => {
        _.extend(metric, {
          arguments: {
            aggregationType: null
          }
        });

        const validation = validateConfiguration(metric, validViewMetadata, validColumns);

        assert.isTrue(validation.calculation.noRateAggregation);
      });

      describe('(count aggregation)', () => {
        beforeEach(() => {
          _.extend(metric, {
            arguments: {
              aggregationType: 'count'
            }
          });
        });

        it('detects missing date reference column', () => {
          _.extend(metric, {
            dateColumn: null
          });

          const validation = validateConfiguration(metric, validViewMetadata, validColumns);

          assert.isTrue(validation.calculation.noReferenceDateColumn);
        });

        it('detects missing numerator column', () => {
          _.extend(metric, {
            arguments: {
              numeratorColumn: null
            }
          });

          const validation = validateConfiguration(metric, validViewMetadata, validColumns);

          assert.isTrue(validation.calculation.noNumeratorColumn);
        });

        it('detects missing denominator column', () => {
          _.extend(metric, {
            arguments: {
              denominatorColumn: null
            }
          });

          const validation = validateConfiguration(metric, validViewMetadata, validColumns);

          assert.isTrue(validation.calculation.noDenominatorColumn);
        });

        it('does not warn about missing denominator column when a fixed value is given', () => {
          _.extend(metric, {
            arguments: {
              fixedDenominator: 100
            }
          });

          const validation = validateConfiguration(metric, validViewMetadata, validColumns);

          assert.isFalse(validation.calculation.noDenominatorColumn);
        });
      });

      describe('(sum aggregation)', () => {
        beforeEach(() => {
          _.extend(metric, {
            arguments: {
              aggregationType: 'sum'
            }
          });
        });

        it('detects missing date reference column', () => {
          _.extend(metric, {
            dateColumn: null
          });

          const validation = validateConfiguration(metric, validViewMetadata, validColumns);

          assert.isTrue(validation.calculation.noReferenceDateColumn);
        });

        it('detects missing numerator column', () => {
          _.extend(metric, {
            arguments: {
              numeratorColumn: null
            }
          });

          const validation = validateConfiguration(metric, validViewMetadata, validColumns);

          assert.isTrue(validation.calculation.noNumeratorColumn);
        });

        it('detects missing denominator column', () => {
          _.extend(metric, {
            arguments: {
              denominatorColumn: null
            }
          });

          const validation = validateConfiguration(metric, validViewMetadata, validColumns);

          assert.isTrue(validation.calculation.noDenominatorColumn);
        });

        it('does not warn about missing denominator column when a fixed value is given', () => {
          _.extend(metric, {
            arguments: {
              fixedDenominator: 100
            }
          });

          const validation = validateConfiguration(metric, validViewMetadata, validColumns);

          assert.isFalse(validation.calculation.noDenominatorColumn);
        });

        it('detects lack of numeric column', () => {
          const columnsWithoutNumeric = validColumns.slice(1);

          const validation = validateConfiguration(metric, validViewMetadata, columnsWithoutNumeric);

          assert.isTrue(validation.calculation.noNumericColumn);
        });
      });
    });
  });

  describe('data source group', () => {
    it('detects missing data source', () => {
      const validation = validateConfiguration(validMetric, null, validColumns);

      assert.isTrue(validation.dataSource.noDataSource);
    });

    it('detects lack of date column', () => {
      const columnsWithoutDate = validColumns.slice(0, 2);

      const validation = validateConfiguration(validMetric, validViewMetadata, columnsWithoutDate);

      assert.isTrue(validation.dataSource.noDateColumn);
    });
  });

  describe('reporting period group', () => {
    it('detects missing start date', () => {
      const metric = _.extend({}, validMetric, {
        reportingPeriod: { startDate: null }
      });

      const validation = validateConfiguration(metric, validViewMetadata, validColumns);

      assert.isTrue(validation.reportingPeriod.noStartDate);
    });

    it('detects missing period type', () => {
      const metric = _.extend({}, validMetric, {
        reportingPeriod: { type: null }
      });

      const validation = validateConfiguration(metric, validViewMetadata, validColumns);

      assert.isTrue(validation.reportingPeriod.noPeriodType);
    });

    it('detects missing period size', () => {
      const metric = _.extend({}, validMetric, {
        reportingPeriod: { size: null }
      });

      const validation = validateConfiguration(metric, validViewMetadata, validColumns);

      assert.isTrue(validation.reportingPeriod.noPeriodSize);
    });
  });

  it('sets multiple keys true when there are multiple problems', () => {
    const metric = _.extend({}, validMetric, {
      dateColumn: null,
      reportingPeriod: { startDate: null }
    });

    const validation = validateConfiguration(metric, validViewMetadata, validColumns);

    assert.isTrue(validation.reportingPeriod.noStartDate);
    assert.isTrue(validation.calculation.noReferenceDateColumn);
  });
});
