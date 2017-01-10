import CalendarDateFilter from 'components/FilterBar/CalendarDateFilter';
import { mockTimeRangeFilter, mockCalendarDateColumn } from './data';
import { Simulate } from 'react-addons-test-utils';
import { renderComponent } from '../../helpers';

describe('CalendarDateFilter', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      filter: mockTimeRangeFilter,
      column: mockCalendarDateColumn,
      onCancel: _.noop,
      onUpdate: _.noop
    });
  }

  const getTitle = (element) => element.querySelector('.filter-control-title');
  const getDateRangePicker = (element) => element.querySelector('.date-range-picker');
  const getDatePickerInputs = (element) => element.querySelectorAll('.date-picker-input');
  const getFooter = (element) => element.querySelector('.filter-footer');
  const getApplyButton = (element) => element.querySelector('.apply-btn');

  it('renders a title', () => {
    const element = renderComponent(CalendarDateFilter, getProps());
    expect(getTitle(element)).to.exist;
  });

  it('renders a date picker', () => {
    const element = renderComponent(CalendarDateFilter, getProps());
    expect(getDateRangePicker(element)).to.exist;
  });

  it('renders two input fields', () => {
    const element = renderComponent(CalendarDateFilter, getProps());
    expect(getDatePickerInputs(element)).to.have.length(2);
  });

  it('renders a footer', () => {
    const element = renderComponent(CalendarDateFilter, getProps());
    expect(getFooter(element)).to.exist;
  });

  it('disables apply if the date range is invalid', () => {
    const element = renderComponent(CalendarDateFilter, getProps());
    const input = getDatePickerInputs(element)[0];

    expect(getApplyButton(element)).to.be.disabled;
  });

  it('enables apply if the date range is valid', () => {
    const element = renderComponent(CalendarDateFilter, getProps());
    const input = getDatePickerInputs(element)[0];

    expect(getApplyButton(element)).to.not.be.disabled;
  });

  it('disables the apply button if the date range is identical to the existing date range', () => {
    const element = renderComponent(CalendarDateFilter, getProps());
    const input = getDatePickerInputs(element)[0];

    expect(getApplyButton(element)).to.be.disabled;

    input.value = 1;
    Simulate.change(input);

    expect(getApplyButton(element)).to.be.disabled;

    input.value = 2;
    Simulate.change(input);

    expect(getApplyButton(element)).to.not.be.disabled;
  });
});
