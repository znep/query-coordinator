import _ from 'lodash';
import { shallow } from 'enzyme';
import React from 'react';
import ReactDOM from 'react-dom';
import { assert } from 'chai';

import I18n from 'common/i18n';

import { MeasureTitle } from 'common/performance_measures/components/MeasureTitle';
import { MeasureChart } from 'common/performance_measures/components/MeasureChart';

describe('MeasureChart', () => {
  const getProps = (props) => {
    return {
      measure: {},
      ...props
    };
  };

  describe('showMetadata', () => {
    const props = getProps({
      computedMeasure: {
        series: [],
        errors: {}
      },
      lens: { name: 'foo' },
      measure: { metadata: { shortName: 'bar' } }
    });

    it('set to true should render a title', () => {
      const element = shallow(<MeasureChart showMetadata {...props} />);
      const title = element.find(MeasureTitle);
      assert.lengthOf(title, 1);
      assert.equal(
        props.lens,
        title.prop('lens')
      );
      assert.equal(
        props.measure,
        title.prop('measure')
      );
    });

    it('not set should render no title', () => {
      const element = shallow(<MeasureChart {...props} />);
      const title = element.find(MeasureTitle);
      assert.lengthOf(title, 0);
    });
  });

  describe('when computedMeasure has series', () => {
    it('renders a placeholder when series is empty', () => {
      const props = getProps({
        computedMeasure: {
          series: [],
          errors: {}
        }
      });
      const element = shallow(<MeasureChart {...props} />);

      assert.lengthOf(element.find('.measure-result-placeholder'), 1);
    });

    it('renders a placeholder when series contains only null values', () => {
      const props = getProps({
        computedMeasure: {
          series: [['2000-12-01T00:00:00.000', null], ['2001-01-01T00:00:00.000', null]],
          errors: {}
        }
      });
      const element = shallow(<MeasureChart {...props} />);

      assert.lengthOf(element.find('.measure-result-placeholder'), 1);
    });

    describe('when series contains non-null values', () => {
      it('does NOT render a placeholder', () => {
        const props = getProps({
          computedMeasure: {
            series: [['2000-12-01T00:00:00.000', '0'], ['2001-01-01T00:00:00.000', '1']],
            errors: {}
          }
        });
        const element = shallow(<MeasureChart {...props} />);

        assert.lengthOf(element.find('.measure-result-placeholder'), 0);
      });
    });
  });

  describe('when computedMeasure does NOT have series', () => {
    it('renders a placeholder', () => {
      // computedMeasure has defaultValue of {}
      const element = shallow(<MeasureChart {...getProps()} />);

      assert.lengthOf(element.find('.measure-result-placeholder'), 1);
    });

    it('displays a message about no_visualization', () => {
      const element = shallow(<MeasureChart {...getProps()} />);
      const placeholder = element.find('.measure-result-placeholder-text');

      assert.lengthOf(placeholder, 1);
      assert.include(placeholder.text(), I18n.t('shared.performance_measures.no_visualization'));
    });
  });

  it('renders a spinner if measure is not set', () => {
    const element = shallow(<MeasureChart />);

    assert.lengthOf(element.find('.measure-result-spinner-container'), 1);
  });

  it('renders a spinner if dataRequestInFlight is set', () => {
    const element = shallow(<MeasureChart dataRequestInFlight {...getProps()} />);

    assert.lengthOf(element.find('.measure-result-spinner-container'), 1);
  });

  it('renders no spinner if dataRequestInFlight is not set', () => {
    const element = shallow(<MeasureChart {...getProps()} />);

    assert.lengthOf(element.find('.measure-result-spinner-container'), 0);
  });

  describe('generateVifFromMeasure', () => {
    const createFakeMeasure = () => {
      return {
        metricConfig: {
          reportingPeriod: {
            startDate: '2018-01-01',
            type: 'open',
            size: 'month'
          },
          dateColumn: 'some-date-column'
        },
        dataSourceLensUid: 'test-test'
      };
    };

    describe('when there is insufficient data to render chart', () => {
      it('returns null if reportingPeriod startDate is not set', () => {
        const element = shallow(<MeasureChart dataRequestInFlight {...getProps()} />);
        const noPeriodStartDate = _.set(createFakeMeasure(), 'metricConfig.reportingPeriod.startDate', null);

        assert.isNull(element.instance().generateVifFromMeasure(noPeriodStartDate, {}));
      });

      it('returns null if reportingPeriod type is not set', () => {
        const element = shallow(<MeasureChart dataRequestInFlight {...getProps()} />);
        const noPeriodType = _.set(createFakeMeasure(), 'metricConfig.reportingPeriod.type', null);

        assert.isNull(element.instance().generateVifFromMeasure(noPeriodType, {}));
      });

      it('returns null if reportingPeriod size is not set', () => {
        const element = shallow(<MeasureChart dataRequestInFlight {...getProps()} />);
        const noPeriodSize = _.set(createFakeMeasure(), 'metricConfig.reportingPeriod.size', null);

        assert.isNull(element.instance().generateVifFromMeasure(noPeriodSize, {}));
      });

      it('returns null if dateColumn is not set', () => {
        const element = shallow(<MeasureChart dataRequestInFlight {...getProps()} />);
        const noDateColumn = _.set(createFakeMeasure(), 'metricConfig.dateColumn', null);

        assert.isNull(element.instance().generateVifFromMeasure(noDateColumn, {}));
      });

      it('returns null if dataSourceLensUid is not set', () => {
        const element = shallow(<MeasureChart dataRequestInFlight {...getProps()} />);
        const noDateColumn = _.set(createFakeMeasure(), 'dataSourceLensUid', null);

        assert.isNull(element.instance().generateVifFromMeasure(noDateColumn, {}));
      });
    });

    it('uses last-open for the point style if reportingPeriod is set to open', () => {
      const element = shallow(<MeasureChart dataRequestInFlight {...getProps()} />);
      const vif = element.instance().generateVifFromMeasure(createFakeMeasure(), {});
      const series = vif.series[0];

      assert.deepPropertyVal(series, 'lineStyle.points', 'last-open');
    });

    it('uses closed for the point style if reportingPeriod is set to closed', () => {
      const element = shallow(<MeasureChart dataRequestInFlight {...getProps()} />);
      const closedPeriodMeasure = _.set(createFakeMeasure(), 'metricConfig.reportingPeriod.type', 'closed');
      const vif = element.instance().generateVifFromMeasure(closedPeriodMeasure, {});
      const series = vif.series[0];

      assert.deepPropertyVal(series, 'lineStyle.points', 'closed');
    });

    it('uses count aggregation only for count calculations', () => {
      const element = shallow(<MeasureChart dataRequestInFlight {...getProps()} />);
      const countCalcMeasure = _.set(createFakeMeasure(), 'metricConfig.type', 'count');
      const vif = element.instance().generateVifFromMeasure(countCalcMeasure, {});
      const series = vif.series[0];

      assert.deepPropertyVal(series, 'dataSource.measure.aggregationFunction', 'count');
    });

    it('uses sum aggregations for non-count calculations', () => {
      const element = shallow(<MeasureChart dataRequestInFlight {...getProps()} />);
      const rateCalcMeasure = _.set(createFakeMeasure(), 'metricConfig.type', 'rate');
      const vif = element.instance().generateVifFromMeasure(rateCalcMeasure, {});
      const series = vif.series[0];

      assert.deepPropertyVal(series, 'dataSource.measure.aggregationFunction', 'sum');
    });
  });
});
