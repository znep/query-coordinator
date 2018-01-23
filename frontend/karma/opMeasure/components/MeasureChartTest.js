import { shallow } from 'enzyme';
import React from 'react';
import ReactDOM from 'react-dom';
import { assert } from 'chai';

import I18n from 'common/i18n';

import { MeasureChart } from 'opMeasure/components/MeasureChart';

describe('MeasureChart', () => {

  const getProps = (props) => {
    return {
      measure: {},
      ...props
    };
  };

  describe('when computedMeasure has series', () => {
    it('does NOT render a placeholder', () => {
      const props = getProps({
        computedMeasure: {
          series: [] // Empty for now. // TODO test non-empty series. See below.
        }
      });
      const element = shallow(<MeasureChart {...props} />);
      assert.lengthOf(element.find('.measure-result-placeholder'), 0);
    });

    // TODO: Add any specific viz tests here after integration with SVGTimelineChart
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
      assert.include(placeholder.text(), I18n.t('open_performance.no_visualization'));
    });
  });

  it('renders a spinner if dataRequestInFlight is set', () => {
    const element = shallow(<MeasureChart dataRequestInFlight {...getProps()} />);
    assert.lengthOf(element.find('.spinner-default'), 1);
  });

  it('renders no spinner if dataRequestInFlight is not set', () => {
    const element = shallow(<MeasureChart {...getProps()} />);
    assert.lengthOf(element.find('.spinner-default'), 0);
  });

});
