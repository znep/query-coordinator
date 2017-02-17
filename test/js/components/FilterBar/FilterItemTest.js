import FilterItem from 'components/FilterBar/FilterItem';
import { Simulate } from 'react-addons-test-utils';
import { renderComponent } from '../../helpers';
import {
  mockValueRangeFilter,
  mockBinaryOperatorFilter,
  mockTimeRangeFilter,
  mockCalendarDateColumn,
  mockNumberColumn,
  mockTextColumn
} from './data';

describe('FilterItem', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      filter: mockValueRangeFilter,
      column: mockNumberColumn,
      isReadOnly: false,
      fetchSuggestions: _.constant(Promise.resolve([])),
      onUpdate: _.noop,
      onRemove: _.noop
    });
  }

  let element;

  beforeEach(() => {
    element = renderComponent(FilterItem, getProps());
  });

  const getControlToggle = (element) => element.querySelector('.filter-control-toggle');
  const getConfigToggle = (element) => element.querySelector('.filter-config-toggle');
  const getControls = (element) => element.querySelector('.filter-controls');
  const getConfig = (element) => element.querySelector('.filter-config');

  it('renders if isHidden is true and isReadOnly is false', () => {
    element = renderComponent(FilterItem, getProps({
      filter: _.merge({}, mockValueRangeFilter, {
        isHidden: true
      })
    }));

    expect(element).to.exist;
  });

  describe('filter control', () => {
    it('renders a control toggle', () => {
      expect(getControlToggle(element)).to.exist;
    });

    it('renders the column name in the toggle', () => {
      expect(getControlToggle(element).textContent).to.equal('Dinosaur Age (approximate)');
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

    it('renders a calendar_date filter when the column is a calendar_date column', () => {
      const element = renderComponent(FilterItem, getProps({
        filter: mockTimeRangeFilter,
        column: mockCalendarDateColumn
      }));

      Simulate.click(getControlToggle(element));
      expect(getControls(element)).to.have.class('calendar-date-filter');
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

  describe('when isReadOnly is true', () => {
    it('renders if isHidden is set to false', () => {
      element = renderComponent(FilterItem, getProps({
        filter: _.merge({}, mockValueRangeFilter, {
          isHidden: false
        }),
        isReadOnly: true
      }));

      expect(element).to.exist;
    });

    it('does not render the config toggle', () => {
      element = renderComponent(FilterItem, getProps({
        filter: mockValueRangeFilter,
        isReadOnly: true
      }));

      expect(getConfigToggle(element)).to.not.exist;
    });
  });
});
