import NumberFilter from 'components/FilterBar/NumberFilter';
import { mockValueRangeFilter, mockNumberColumn } from './data';
import { Simulate } from 'react-addons-test-utils';

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

  it('does not update the input if the number would produce an invalid range', () => {
    const element = renderComponent(NumberFilter, getProps());
    const input = getInputs(element)[0];

    input.value = 1000;
    Simulate.change(input);

    expect(input.value).to.equal('1');
  });

  it('updates the input to reflect the new range if it produces a valid range', () => {
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
});
