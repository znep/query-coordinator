import NumberFilter from 'components/FilterBar/NumberFilter';
import { mockValueRangeFilter, mockNumberColumn } from './data';
import { Simulate } from 'react-addons-test-utils';
import { renderComponent } from '../../helpers';

describe('NumberFilter', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      filter: mockValueRangeFilter,
      column: mockNumberColumn,
      onCancel: _.noop,
      onUpdate: _.noop
    });
  }

  const getTitle = (element) => element.querySelector('.filter-control-title');
  const getSlider = (element) => element.querySelector('.input-range-slider');
  const getInputs = (element) => element.querySelectorAll('.range-input');
  const getFooter = (element) => element.querySelector('.filter-footer');
  const getApplyButton = (element) => element.querySelector('.apply-btn');
  const getClearButton = (element) => element.querySelector('.clear-btn')

  it('renders a title', () => {
    const element = renderComponent(NumberFilter, getProps());
    expect(getTitle(element)).to.exist;
  });

  it('renders a slider', () => {
    const element = renderComponent(NumberFilter, getProps());
    expect(getSlider(element)).to.exist;
  });

  it('renders two input fields', () => {
    const element = renderComponent(NumberFilter, getProps());
    expect(getInputs(element)).to.have.length(2);
  });

  it('renders a footer', () => {
    const element = renderComponent(NumberFilter, getProps());
    expect(getFooter(element)).to.exist;
  });

  it('computes the proper step based on the minimum precision of the range', () => {
    const element = renderComponent(NumberFilter, getProps());
    const inputs = getInputs(element);
    expect(_.map(inputs, 'step')).to.deep.equal(['0.01', '0.01']);
  });

  it('disables the apply button if the range is identical to the existing range', () => {
    const element = renderComponent(NumberFilter, getProps());
    const input = getInputs(element)[0];
    const originalValue = input.value;

    expect(getApplyButton(element)).to.have.attribute('disabled');

    input.value = 2;
    Simulate.change(input);

    expect(getApplyButton(element)).to.not.have.attribute('disabled');

    input.value = originalValue;
    Simulate.change(input);

    expect(getApplyButton(element)).to.have.attribute('disabled');
  });

  describe('when changed', () => {
    let spy;
    let element;
    let start;
    let end;

    beforeEach(() => {
      spy = sinon.spy();
      element = renderComponent(NumberFilter, getProps({
        onUpdate: spy
      }));
      [start, end] = getInputs(element);
    });

    it('updates the input to reflect the new range', () => {
      start.value = 2;
      Simulate.change(start);

      Simulate.click(getApplyButton(element));

      const filter = spy.firstCall.args[0];
      expect(filter.arguments.start).to.equal(2);

      expect(start.value).to.equal('2');
    });

    it('allows ranges outside the min and max of the column', () => {
      start.value = -200;
      Simulate.change(start);

      end.value = 2000;
      Simulate.change(end);

      Simulate.click(getApplyButton(element));

      const filter = spy.firstCall.args[0];
      expect(filter.arguments.start).to.equal(-200);
      expect(filter.arguments.end).to.equal(2000.0001);

      expect(start.value).to.equal('-200');
      expect(end.value).to.equal('2000');
    });

    it('generates filters that have a small amount added to the end of the range', () => {
      start.value = 1.01;
      Simulate.change(start);

      end.value = 2.4;
      Simulate.change(end);

      Simulate.click(getApplyButton(element));

      // Since the smallest precision is .01, the end of the range will have .0001 added to it.
      const filter = spy.firstCall.args[0];
      expect(filter.arguments.start).to.equal(1.01);
      expect(filter.arguments.end).to.equal(2.4001);
    });

    it('swaps the start and end of the range if necessary', () => {
      start.value = 10;
      Simulate.change(start);

      end.value = 1;
      Simulate.change(end);

      Simulate.click(getApplyButton(element));

      const filter = spy.firstCall.args[0];
      expect(filter.arguments.start).to.equal(1);
      expect(filter.arguments.end).to.equal(10.0001);
    });

    it('does not reset filter visibility when resetting values', () => {
      // mockValueRangeFilter is set with isHidden: false
      // the "default" filter specifies isHidden: true

      Simulate.click(getClearButton(element));
      Simulate.click(getApplyButton(element));

      const filter = spy.firstCall.args[0];
      expect(filter.isHidden).to.be.false;
    });
  });
});
