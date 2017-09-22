import _ from 'lodash';
import I18n from 'common/i18n';
import allLocales from 'common/i18n/config/locales';
import FilterItem from 'components/FilterBar/FilterItem';
import { Simulate } from 'react-dom/test-utils';
import { renderComponent } from '../../helpers';
import {
  mockValueRangeFilter,
  mockBinaryOperatorFilter,
  mockTimeRangeFilter,
  mockCalendarDateColumn,
  mockMoneyColumn,
  mockNumberColumn,
  mockTextColumn
} from './data';

// Can't use jQuery's .click() event
// because jQuery can only trigger event
// handlers it attached itself (FilterItem
// uses the native browser APIs.
const clickBody = () => {
  const clickEvent = document.createEvent('Event');
  clickEvent.initEvent('click', true, true);
  document.body.dispatchEvent(clickEvent);
};

const getControlToggle = (element) => element.querySelector('.filter-control-toggle');
const getConfigToggle = (element) => element.querySelector('.filter-config-toggle');
const getControls = (element) => element.querySelector('.filter-controls');
const getConfig = (element) => element.querySelector('.filter-config');

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
    I18n.translations.en = allLocales.en;
    element = renderComponent(FilterItem, getProps());
  });

  afterEach(() => {
    I18n.translations = {};
  });

  it('renders if isHidden is true and isReadOnly is false', () => {
    element = renderComponent(FilterItem, getProps({
      filter: _.merge({}, mockValueRangeFilter, {
        isHidden: true
      })
    }));

    assert.isNotNull(element);
  });

  describe('filter control', () => {
    it('renders a control toggle', () => {
      assert.isNotNull(getControlToggle(element));
    });

    it('renders the filter title in the toggle', () => {
      assert.include(getControlToggle(element).textContent, 'From 1 to 3');
    });

    it('toggles visibility of filter controls when the toggle is clicked', () => {
      assert.isNull(getControls(element));

      Simulate.click(getControlToggle(element));
      assert.isNotNull(getControls(element));

      Simulate.click(getControlToggle(element));
      assert.isNull(getControls(element));
    });

    it('renders a number filter when the column is a money column', () => {
      Simulate.click(getControlToggle(element));
      assert.isTrue(getControls(element).classList.contains('number-filter'));
    });

    it('renders a number filter when the column is a number column', () => {
      element = renderComponent(FilterItem, getProps({
        column: mockMoneyColumn
      }));

      Simulate.click(getControlToggle(element));
      assert.isTrue(getControls(element).classList.contains('number-filter'));
    });

    it('renders a text filter when the column is a text column', () => {
      element = renderComponent(FilterItem, getProps({
        filter: mockBinaryOperatorFilter,
        column: mockTextColumn
      }));

      Simulate.click(getControlToggle(element));
      assert.isTrue(getControls(element).classList.contains('text-filter'));
    });

    it('renders a calendar_date filter when the column is a calendar_date column', () => {
      element = renderComponent(FilterItem, getProps({
        filter: mockTimeRangeFilter,
        column: mockCalendarDateColumn
      }));

      Simulate.click(getControlToggle(element));
      assert.isTrue(getControls(element).classList.contains('calendar-date-filter'));
    });

    it('closes the controls when the body is clicked', () => {
      Simulate.click(getControlToggle(element));
      assert.isNotNull(getControls(element));
      clickBody();
      assert.isNull(getControls(element));
    });

    it('closes the controls when the config toggle is clicked', () => {
      Simulate.click(getControlToggle(element));
      assert.isNotNull(getControls(element));
      Simulate.click(getConfigToggle(element));
      assert.isNull(getControls(element));
      assert.isNotNull(getConfig(element));
    });
  });

  describe('filter config', () => {
    it('renders a filter config toggle', () => {
      assert.isNotNull(getControlToggle(element));
    });

    it('toggles visibility of the filter config when the toggle is clicked', () => {
      assert.isNull(getConfig(element));

      Simulate.click(getConfigToggle(element));
      assert.isNotNull(getConfig(element));

      Simulate.click(getConfigToggle(element));
      assert.isNull(getConfig(element));
    });

    it('closes the config when the body is clicked', () => {
      Simulate.click(getConfigToggle(element));
      assert.isNotNull(getConfig(element));
      clickBody();
      assert.isNull(getConfig(element));
    });

    it('closes the config when the control toggle is clicked', () => {
      Simulate.click(getConfigToggle(element));
      assert.isNotNull(getConfig(element));
      Simulate.click(getControlToggle(element));
      assert.isNull(getConfig(element));
      assert.isNotNull(getControls(element));
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

      assert.isNotNull(element);
    });

    it('does not render the config toggle', () => {
      element = renderComponent(FilterItem, getProps({
        filter: mockValueRangeFilter,
        isReadOnly: true
      }));

      assert.isNull(getConfigToggle(element));
    });
  });
});
