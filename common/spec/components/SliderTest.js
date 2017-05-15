import _ from 'lodash';
import React from 'react';
import { renderComponent } from '../helpers';
import Slider from 'components/Slider';

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

  describe('when using an Object value', () => {
    it('uses the start and end values if provided', () => {
      const element = renderComponent(Slider, getProps({
        value: {
          start: 13,
          end: 42
        }
      }));
      const labels = getLabels(element);

      expect(labels).to.have.lengthOf(2);
      expect(labels[0].innerText).to.equal('13');
      expect(labels[1].innerText).to.equal('42');
    });
  });

  describe('when using a Number value', () => {
    it('sets the value and renders a handle', () => {
      const element = renderComponent(Slider, getProps({
        value: 13
      }));
      const labels = getLabels(element);

      expect(labels).to.have.lengthOf(1);
      expect(labels[0].innerText).to.equal('13');
    });
  });

  it('defaults to rangeMax when value is provided', () => {
    const element = renderComponent(Slider, getProps());
    const labels = getLabels(element);

    expect(labels).to.have.lengthOf(1);
    expect(labels[0].innerText).to.equal('100');
  });
});
