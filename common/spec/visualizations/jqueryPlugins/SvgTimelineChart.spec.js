import _ from 'lodash';
import $ from 'jquery';
import { inlineDataQuery } from 'common/visualizations/SvgTimelineChart';

describe('SvgTimelineChart jQuery component', () => {
  describe('inlineDataQuery', () => {
    it('should throw if shouldDisplayFilterBar', () => {
      assert.throws(
        () => {
          inlineDataQuery(
            {
              shouldDisplayFilterBar: () => true
            },
            {}
          );
        },
        'Filter bar not supported'
      );
    });

    describe('a single-series inline data vif', () => {
      const singleSeries = {
        series: [{
          dataSource: {
            precision: 'MONTH',
            dimension: {
              columnName: 'date',
              aggregationFunction: null
            },
            measure: {
              columnName: 'some_measure_column',
              aggregationFunction: 'count'
            },
            type: 'socrata.inline',
            rows: [
              [
                '2001-01-01T00:00:00.000',
                1234
              ],
              [
                '2001-02-01T00:00:00.000',
                4567
              ]
            ]
          },
          label: 'Fake KPI data',
          type: 'timelineChart'
        }],
        format: { type: 'visualization_interchange_format', version: 2 }
      };

      const result = inlineDataQuery(
        { shouldDisplayFilterBar: () => false },
        singleSeries
      );

      it('generates columns', () => {
        assert.deepEqual(result.columns, ['dimension', 'some_measure_column']);
      });

      it('generates column formats', () => {
        assert.deepEqual(result.columnFormats, {
          date: {
            fieldName: 'date',
            dataTypeName: 'calendar_date',
            renderTypeName: 'calendar_date'
          },
          some_measure_column: {
            name: 'Fake KPI data',
            fieldName: 'some_measure_column',
            dataTypeName: 'number',
            renderTypeName: 'number'
          }
        });
      });

      it('passes through precision in lowercase', () => {
        assert.propertyVal(result, 'precision', 'month');
      });

      it('returns rows', () => {
        assert.deepEqual(result.rows, singleSeries.series[0].dataSource.rows);
      });
    });
  });
});
