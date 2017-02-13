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

  it('allows ranges outside the min and max of the column', () => {
    const element = renderComponent(NumberFilter, getProps());

    const start = getInputs(element)[0];
    const end = getInputs(element)[1];

    start.value = -200;
    Simulate.change(start);

    end.value = 2000;
    Simulate.change(end);

    expect(start.value).to.equal('-200');
    expect(end.value).to.equal('2000');
  });

  it('updates the input to reflect the new range', () => {
    const element = renderComponent(NumberFilter, getProps());
    const input = getInputs(element)[0];

    input.value = 2;
    Simulate.change(input);

    expect(input.value).to.equal('2');
  });

  it('disables the apply button if the range is identical to the existing range', () => {
    const element = renderComponent(NumberFilter, getProps());
    const input = getInputs(element)[0];

    expect(getApplyButton(element)).to.be.disabled;

    input.value = 1;
    Simulate.change(input);

    expect(getApplyButton(element)).to.be.disabled;

    input.value = 2;
    Simulate.change(input);

    expect(getApplyButton(element)).to.not.be.disabled;
  });

  it('computes the proper step based on the minimum precision of the range', () => {
    const element = renderComponent(NumberFilter, getProps());
    const inputs = getInputs(element);
    expect(_.map(inputs, 'step')).to.deep.equal(['0.01', '0.01']);
  });

  it('generates filters that have a small amount added to the end of the range', () => {
    const spy = sinon.spy();
    const element = renderComponent(NumberFilter, getProps({
      onUpdate: spy
    }));

    const inputs = getInputs(element);

    inputs[0].value = 1.01;
    Simulate.change(inputs[0]);

    inputs[1].value = 2.4;
    Simulate.change(inputs[1]);

    expect(spy.callCount).to.equal(0);
    Simulate.click(getApplyButton(element));
    expect(spy.callCount).to.equal(1);

    // Since the smallest precision is .01, the end of the range will have .0001 added to it.
    const filter = spy.firstCall.args[0];
    expect(filter.arguments.start).to.equal(1.01);
    expect(filter.arguments.end).to.equal(2.4001);
  });

  it('swaps the start and end of the range if necessary', () => {
    const spy = sinon.spy();
    const element = renderComponent(NumberFilter, getProps({
      onUpdate: spy
    }));

    const inputs = getInputs(element);

    inputs[0].value = 10;
    Simulate.change(inputs[0]);

    inputs[1].value = 1;
    Simulate.change(inputs[1]);

    Simulate.click(getApplyButton(element));

    const filter = spy.firstCall.args[0];
    expect(filter.arguments.start).to.equal(1);
    expect(filter.arguments.end).to.equal(10.0001);
  });
});
