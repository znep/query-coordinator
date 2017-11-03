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

  it('renders a spinner if dataRequestInFlight is set', () => {
    const element = shallow(<MeasureResultCard dataRequestInFlight {...getProps()} />);
    assert.lengthOf(element.find('.spinner'), 1);
  });

  it('renders no spinner if dataRequestInFlight is not set', () => {
    const element = shallow(<MeasureResultCard {...getProps()} />);
    assert.lengthOf(element.find('.spinner'), 0);
  });
});
