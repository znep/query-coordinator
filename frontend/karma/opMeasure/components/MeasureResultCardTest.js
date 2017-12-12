import _ from 'lodash';
import { shallow } from 'enzyme';
import React from 'react';
import ReactDOM from 'react-dom';
import { assert } from 'chai';

import { MeasureResultCard } from 'components/MeasureResultCard';

describe('MeasureResultCard', () => {
  const unresolvedPromise = new Promise(_.noop);

  const getProps = (props) => {
    return {
      measure: {},
      ...props
    };
  };

  const getRenderedValue = (element) => element.find('.measure-result-big-number').nodes[0].props.children;

  it('renders a placeholder if computedMeasure is not present', () => {
    const element = shallow(<MeasureResultCard {...getProps()} />);
    assert.lengthOf(element.find('.measure-result-placeholder'), 1);
  });

  it('renders result if it is set in computedMeasure', () => {
    const computedMeasure = {
      result: '33.00'
    };
    const element = shallow(<MeasureResultCard computedMeasure={computedMeasure} {...getProps()} />);
    const bigNumber = element.find('.measure-result-big-number');
    assert.lengthOf(bigNumber, 1);
    assert.equal(bigNumber.text(), '33.00');
  });

  it('adds "percent" class to result only if the measure is a percentage', () => {
    const computedMeasure = {
      result: '33.00'
    };

    const defaultPercentMeasure = {};
    assert.lengthOf(
      shallow(<MeasureResultCard computedMeasure={computedMeasure} measure={defaultPercentMeasure} />).
        find('.measure-result-big-number.percent'),
      0
    );

    const explicitNonPercent = _.set({}, 'metric.display.asPercent', false);
    assert.lengthOf(
      shallow(<MeasureResultCard computedMeasure={computedMeasure} measure={explicitNonPercent} />).
        find('.measure-result-big-number.percent'),
      0
    );

    const percentMeasure = _.set({}, 'metric.display.asPercent', true);
    assert.lengthOf(
      shallow(<MeasureResultCard computedMeasure={computedMeasure} measure={percentMeasure} />).
        find('.measure-result-big-number.percent'),
      1
    );
  });

  it('truncates the result string to fit', () => {
    const computedMeasure = {
      result: '33.1234567890123456789'
    };
    let card;

    const measureWithFixedDecimalPlaces = _.set({}, 'metric.display.decimalPlaces', 5);
    card = shallow(<MeasureResultCard computedMeasure={computedMeasure} measure={measureWithFixedDecimalPlaces} />);
    assert.equal(getRenderedValue(card), '33.12345');

    const measureWithoutDecimalPlaces = {};
    card = shallow(<MeasureResultCard computedMeasure={computedMeasure} measure={measureWithoutDecimalPlaces} />);
    assert.equal(getRenderedValue(card), '33.12345678');

    const measureWithManyDecimalPlaces = _.set({}, 'metric.display.decimalPlaces', 100);
    card = shallow(<MeasureResultCard computedMeasure={computedMeasure} measure={measureWithManyDecimalPlaces} />);
    assert.equal(getRenderedValue(card), '33.12345678'); // Still truncates at a max length.

    computedMeasure.result = '33.123';
    card = shallow(<MeasureResultCard computedMeasure={computedMeasure} measure={measureWithManyDecimalPlaces} />);
    assert.equal(getRenderedValue(card), '33.123');
  });

  // We may want to adjust the logic for when to humanize numbers.
  // Perhaps the metric.display should take in a boolean prop to indicate when to humanize,
  // but for now, we only humanize when number of characters are too many to fit.
  it('displays human readable numbers for large values', () => {
    const computedMeasure = {
      result: '1234567890.00'
    };

    const card = shallow(<MeasureResultCard computedMeasure={computedMeasure} {...getProps()} />);
    assert.equal(getRenderedValue(card), '1.23B');
  });

  it('renders a spinner if dataRequestInFlight is set', () => {
    const element = shallow(<MeasureResultCard dataRequestInFlight {...getProps()} />);
    assert.lengthOf(element.find('.spinner'), 1);
  });

  it('renders no spinner if dataRequestInFlight is not set', () => {
    const element = shallow(<MeasureResultCard {...getProps()} />);
    assert.lengthOf(element.find('.spinner'), 0);
  });
});
