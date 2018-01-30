import _ from 'lodash';
import { shallow } from 'enzyme';
import React from 'react';
import ReactDOM from 'react-dom';
import { assert } from 'chai';

import I18n from 'common/i18n';

import { MeasureResultCard } from 'common/performance_measures/components/MeasureResultCard';

describe('MeasureResultCard', () => {
  const unresolvedPromise = new Promise(_.noop);

  const getProps = (props) => {
    return {
      measure: { dataSourceLensUid: 'test-test' },
      coreView: {},
      ...props
    };
  };

  const getComputedMeasure = (overrides) => {
    return _.merge({
      result: {},
      errors: {}
    }, overrides);
  };

  const getRenderedValue = (element) => element.find('.measure-result-big-number').nodes[0].props.children;

  it('renders a placeholder if computedMeasure is not present', () => {
    const element = shallow(<MeasureResultCard {...getProps()} />);
    assert.lengthOf(element.find('.measure-result-placeholder'), 1);
  });

  it('renders result if it is set in computedMeasure', () => {
    const computedMeasure = getComputedMeasure({
      result: { value: '33.00' }
    });
    const element = shallow(<MeasureResultCard {...getProps({ computedMeasure })} />);
    const bigNumber = element.find('.measure-result-big-number');
    assert.lengthOf(bigNumber, 1);
    assert.equal(bigNumber.text(), '33.00');
  });

  it('adds "percent" class to result only if the measure is a percentage', () => {
    const computedMeasure = getComputedMeasure({
      result: { value: '33.00' }
    });

    const defaultPercentMeasure = {};
    assert.lengthOf(
      shallow(<MeasureResultCard computedMeasure={computedMeasure} measure={defaultPercentMeasure} />).
        find('.measure-result-big-number.percent'),
      0
    );

    const explicitNonPercent = _.set({}, 'metricConfig.display.asPercent', false);
    assert.lengthOf(
      shallow(<MeasureResultCard computedMeasure={computedMeasure} measure={explicitNonPercent} />).
        find('.measure-result-big-number.percent'),
      0
    );

    const percentMeasure = _.set({}, 'metricConfig.display.asPercent', true);
    assert.lengthOf(
      shallow(<MeasureResultCard computedMeasure={computedMeasure} measure={percentMeasure} />).
        find('.measure-result-big-number.percent'),
      1
    );
  });

  describe('result string truncation', () => {
    const computedMeasure = getComputedMeasure({
      result: { value: '33.1234567890123456789' }
    });
    const measureWithoutDecimalPlaces = {};
    const measureWithFixedDecimalPlaces = _.set({}, 'metricConfig.display.decimalPlaces', 1);
    const measureWithManyDecimalPlaces = _.set({}, 'metricConfig.display.decimalPlaces', 100);

    describe('when decimal place display is specified', () => {
      it('renders # of decimal places as long as total string length is below the default maxLength', () => {
        const card = shallow(<MeasureResultCard computedMeasure={computedMeasure} measure={measureWithFixedDecimalPlaces} />);
        assert.equal(getRenderedValue(card), '33.1');
      });

      it('renders a string of maxLength if # of decimal places creates string greater than maxLength', () => {
        const card = shallow(<MeasureResultCard computedMeasure={computedMeasure} measure={measureWithManyDecimalPlaces} />);
        assert.equal(getRenderedValue(card), '33.123'); // Still truncates at a maxLength.
      });
    });

    describe('when decimal place display is not specified', () => {
      it('renders up to the maxLength when no decimal places are specified in display options', () => {
        const card = shallow(<MeasureResultCard computedMeasure={computedMeasure} measure={measureWithoutDecimalPlaces} />);
        assert.equal(getRenderedValue(card), '33.123'); // Truncates to the default maxLength of 6.
      });
    });

    describe('when a different maxLength is provided', () => {
      it('allows a longer string to be rendered', () => {
        const card = shallow(<MeasureResultCard computedMeasure={computedMeasure} measure={measureWithManyDecimalPlaces} maxLength={100} />);
        assert.equal(getRenderedValue(card), computedMeasure.result.value);
      });
    });
  });

  // We may want to adjust the logic for when to humanize numbers.
  // Perhaps the metricConfig.display should take in a boolean prop to indicate when to humanize,
  // but for now, we only humanize when number of characters are too many to fit.
  it('displays human readable numbers for large values', () => {
    const computedMeasure = getComputedMeasure({
      result: { value: '1234567890.00' }
    });

    const card = shallow(<MeasureResultCard {...getProps({ computedMeasure })} />);
    assert.equal(getRenderedValue(card), '1.23B');
  });

  it('renders a spinner if dataRequestInFlight is set', () => {
    const element = shallow(<MeasureResultCard dataRequestInFlight {...getProps()} />);
    assert.lengthOf(element.find('.spinner-default'), 1);
  });

  it('renders no spinner if dataRequestInFlight is not set', () => {
    const element = shallow(<MeasureResultCard {...getProps()} />);
    assert.lengthOf(element.find('.spinner-default'), 0);
  });

  describe('Error messages', () => {
    const getSubtitle = (element) => element.find('.measure-result-placeholder-text').text();

    describe('when measure does not have a dataSourceLensUid', () => {
      it('renders message about no dataset', () => {
        const computedMeasure = getComputedMeasure();
        const measure = {};
        const element = shallow(<MeasureResultCard {...getProps({ computedMeasure, measure })} />);
        assert.include(getSubtitle(element), I18n.t('shared.performance_measures.no_dataset'));
      });
    });

    describe('when computedMeasure.dataSourceNotConfigured = true', () => {
      it('renders message about no dataset', () => {
        const computedMeasure = getComputedMeasure({
          errors: { dataSourceNotConfigured: true }
        });
        const element = shallow(<MeasureResultCard {...getProps({ computedMeasure })} />);
        assert.include(getSubtitle(element), I18n.t('shared.performance_measures.no_dataset'));
      });
    });

    describe('when computedMeasure.calculationNotConfigured = true', () => {
      it('renders message about calculation not configured', () => {
        const computedMeasure = getComputedMeasure({
          errors: { calculationNotConfigured: true }
        });
        const element = shallow(<MeasureResultCard {...getProps({ computedMeasure })} />);
        assert.include(getSubtitle(element), I18n.t('shared.performance_measures.no_calculation'));
      });
    });

    describe('when computedMeasure.noReportingPeriodConfigured = true', () => {
      it('renders message about reporting period not configured', () => {
        const computedMeasure = getComputedMeasure({
          errors: { noReportingPeriodConfigured: true }
        });
        const element = shallow(<MeasureResultCard {...getProps({ computedMeasure })} />);
        assert.include(getSubtitle(element), I18n.t('shared.performance_measures.no_reporting_period'));
      });
    });

    describe('when computedMeasure.noReportingPeriodAvailable = true', () => {
      it('renders message about not enough data', () => {
        const computedMeasure = getComputedMeasure({
          errors: { noReportingPeriodAvailable: true }
        });
        const element = shallow(<MeasureResultCard {...getProps({ computedMeasure })} />);
        assert.include(getSubtitle(element), I18n.t('shared.performance_measures.not_enough_data'));
      });
    });

    describe('when result is "NaN" or "Infinity"', () => {
      it('renders message about not enough data', () => {
        const computedMeasure = {
          result: { value: 'NaN' },
          errors: { dividingByZero: true }
        };
        let element = shallow(<MeasureResultCard {...getProps({ computedMeasure })} />);
        assert.include(getSubtitle(element), I18n.t('shared.performance_measures.measure.dividing_by_zero'));

        computedMeasure.result.value = 'Infinity';
        element = shallow(<MeasureResultCard {...getProps({ computedMeasure })} />);
        assert.include(getSubtitle(element), I18n.t('shared.performance_measures.measure.dividing_by_zero'));
      });
    });

  });
});
