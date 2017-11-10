import TestUtils from 'react-dom/test-utils';
import defaultProps from '../defaultProps';
import renderComponent from '../renderComponent';
import { MeasureAxisOptions } from 'common/authoring_workflow/components/MeasureAxisOptions';
import { INPUT_DEBOUNCE_MILLISECONDS } from 'common/authoring_workflow/constants';

describe('MeasureAxisOptions', () => {
  function emitsEvent(id, eventName, eventType) {
    it(`should emit an ${eventName} event`, (done) => {
      TestUtils.Simulate[eventType || 'change'](component.querySelector(id));
      setTimeout(() => {
        sinon.assert.calledOnce(props[eventName]);
        done();
      }, INPUT_DEBOUNCE_MILLISECONDS);
    });
  }

  var component;

  const props = defaultProps({
    maxLimit: 60000,
    minLimit: 10000,
    onRadioButtonChange: () => {},
    onMaxValueTextboxChange: sinon.spy(),
    onMinValueTextboxChange: sinon.spy()
  });

  beforeEach(() => {
    component = renderComponent(MeasureAxisOptions, props);
  });

  describe('rendering', () => {

    it('renders automatic selection', () => {
      assert.isNotNull(component.querySelector('#measure-axis-scale-automatic'));
    });

    it('renders custom selection', () => {
      assert.isNotNull(component.querySelector('#measure-axis-scale-custom'));
    });

    it('renders min input', () => {
      assert.isNotNull(component.querySelector('#measure-axis-scale-custom-min'));
    });

    it('renders max input', () => {
      assert.isNotNull(component.querySelector('#measure-axis-scale-custom-max'));
    });
  });

  describe('events', () => {

    describe('when clicking #measure-axis-scale-custom-min', () => {
      emitsEvent('#measure-axis-scale-custom-min', 'onMinValueTextboxChange');
    });

    describe('when clicking #measure-axis-scale-custom-max', () => {
      emitsEvent('#measure-axis-scale-custom-max', 'onMaxValueTextboxChange');
    });
  });
});
