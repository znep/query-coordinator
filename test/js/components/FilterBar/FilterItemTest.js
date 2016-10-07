import FilterItem from 'components/FilterBar/FilterItem';
import { Simulate } from 'react-addons-test-utils';
import { mockValueRangeFilter, mockBinaryOperatorFilter, mockNumberColumn, mockTextColumn } from './data';

describe('FilterItem', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      filter: mockValueRangeFilter,
      column: mockNumberColumn,
      fetchSuggestions: _.constant(Promise.resolve([]))
    });
  }

  let element;

  beforeEach(() => {
    element = renderComponent(FilterItem, getProps());
  });

  const getTitle = (element) => element.querySelector('.filter-title');
  const getToggle = (element) => element.querySelector('.filter-control-toggle');
  const getControls = (element) => element.querySelector('.filter-controls');

  it('renders a title', () => {
    expect(getTitle(element).textContent).to.equal('Dinosaur Age (approximate)');
  });

  it('renders a control toggle', () => {
    expect(getToggle(element)).to.exist;
  });

  it('toggles visibility of filter controls when the toggle is clicked', () => {
    expect(getControls(element)).to.not.exist;

    Simulate.click(getToggle(element));
    expect(getControls(element)).to.exist;

    Simulate.click(getToggle(element));
    expect(getControls(element)).to.not.exist;
  });

  it('renders a number filter when the column is a number column', () => {
    Simulate.click(getToggle(element));
    expect(getControls(element)).to.have.class('number-filter');
  });

  it('renders a text filter when the column is a text column', () => {
    const element = renderComponent(FilterItem, getProps({
      filter: mockBinaryOperatorFilter,
      column: mockTextColumn
    }));

    Simulate.click(getToggle(element));
    expect(getControls(element)).to.have.class('text-filter');
  });

  it('closes the controls when the body is clicked', () => {
    Simulate.click(getToggle(element));
    expect(getControls(element)).to.exist;
    document.body.click();
    expect(getControls(element)).to.not.exist;
  });
});
