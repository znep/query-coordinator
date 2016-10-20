import _ from 'lodash';
import React from 'react';
import Slider from 'components/FilterBar/Slider';

describe('Slider', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      rangeMin: 0,
      rangeMax: 100,
      onChange: _.noop
    });
  }

  // Note: InputRange is rendered by react-input-range
  const getLabels = (element) => element.querySelectorAll('.InputRange-label--value');

  it('renders an element', () => {
    const element = renderComponent(Slider, getProps());
    expect(element).to.exist;
  });

  it('uses the start and end values if provided', () => {
    const element = renderComponent(Slider, getProps({
      value: {
        start: 13,
        end: 42
      }
    }));
    const labels = getLabels(element);

    expect(labels[0].innerText).to.equal('13');
    expect(labels[1].innerText).to.equal('42');
  });

  it('defaults to the rangeMin and rangeMax when no start and end are provided', () => {
    const element = renderComponent(Slider, getProps());
    const labels = getLabels(element);

    expect(labels[0].innerText).to.equal('0');
    expect(labels[1].innerText).to.equal('100');
  });
});
