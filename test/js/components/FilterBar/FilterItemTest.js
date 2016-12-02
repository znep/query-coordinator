import FilterItem from 'components/FilterBar/FilterItem';
import { Simulate } from 'react-addons-test-utils';
import { renderComponent } from '../../helpers';
import { mockValueRangeFilter, mockBinaryOperatorFilter, mockNumberColumn, mockTextColumn } from './data';

describe('FilterItem', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      filter: mockValueRangeFilter,
      column: mockNumberColumn,
      fetchSuggestions: _.constant(Promise.resolve([])),
      onUpdate: _.noop,
      onRemove: _.noop
    });
  }

  let element;

  beforeEach(() => {
    element = renderComponent(FilterItem, getProps());
  });

  const getTitle = (element) => element.querySelector('.filter-title');
  const getControlToggle = (element) => element.querySelector('.filter-control-toggle');
  const getConfigToggle = (element) => element.querySelector('.filter-config-toggle');
  const getControls = (element) => element.querySelector('.filter-controls');
  const getConfig = (element) => element.querySelector('.filter-config');

  it('renders a title', () => {
    expect(getTitle(element).textContent).to.equal('Dinosaur Age (approximate)');
  });

  describe('filter control', () => {
    it('renders a control toggle', () => {
      expect(getControlToggle(element)).to.exist;
    });

    it('toggles visibility of filter controls when the toggle is clicked', () => {
      expect(getControls(element)).to.not.exist;

      Simulate.click(getControlToggle(element));
      expect(getControls(element)).to.exist;

      Simulate.click(getControlToggle(element));
      expect(getControls(element)).to.not.exist;
    });

    it('renders a number filter when the column is a number column', () => {
      Simulate.click(getControlToggle(element));
      expect(getControls(element)).to.have.class('number-filter');
    });

    it('renders a text filter when the column is a text column', () => {
      const element = renderComponent(FilterItem, getProps({
        filter: mockBinaryOperatorFilter,
        column: mockTextColumn
      }));

      Simulate.click(getControlToggle(element));
      expect(getControls(element)).to.have.class('text-filter');
    });

    it('closes the controls when the body is clicked', () => {
      Simulate.click(getControlToggle(element));
      expect(getControls(element)).to.exist;
      document.body.click();
      expect(getControls(element)).to.not.exist;
    });

    it('closes the controls when the config toggle is clicked', () => {
      Simulate.click(getControlToggle(element));
      expect(getControls(element)).to.exist;
      Simulate.click(getConfigToggle(element));
      expect(getControls(element)).to.not.exist;
      expect(getConfig(element)).to.exist;
    });
  });

  describe('filter config', () => {
    it('renders a filter config toggle', () => {
      expect(getControlToggle(element)).to.exist;
    });

    it('toggles visibility of the filter config when the toggle is clicked', () => {
      expect(getConfig(element)).to.not.exist;

      Simulate.click(getConfigToggle(element));
      expect(getConfig(element)).to.exist;

      Simulate.click(getConfigToggle(element));
      expect(getConfig(element)).to.not.exist;
    });

    it('closes the config when the body is clicked', () => {
      Simulate.click(getConfigToggle(element));
      expect(getConfig(element)).to.exist;
      document.body.click();
      expect(getConfig(element)).to.not.exist;
    });

    it('closes the config when the control toggle is clicked', () => {
      Simulate.click(getConfigToggle(element));
      expect(getConfig(element)).to.exist;
      Simulate.click(getControlToggle(element));
      expect(getConfig(element)).to.not.exist;
      expect(getControls(element)).to.exist;
    });
  });
});
