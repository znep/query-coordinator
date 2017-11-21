import _ from 'lodash';
import CalendarDateFilter from 'components/FilterBar/FilterEditor/CalendarDateFilter';
import { mockTimeRangeFilter, mockCalendarDateColumn } from './data';
import { Simulate } from 'react-dom/test-utils';
import { renderComponent } from '../../helpers';
import $ from 'jquery';

describe('CalendarDateFilter', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      filter: mockTimeRangeFilter,
      column: mockCalendarDateColumn,
      onClickConfig: _.noop,
      onRemove: _.noop,
      onUpdate: _.noop
    });
  }

  const getTitle = (element) => element.querySelector('.filter-control-title');
  const getDateRangePicker = (element) => element.querySelector('.date-range-picker');
  const getDatePickerInputs = (element) => element.querySelectorAll('.date-picker-input');
  const getFooter = (element) => element.querySelector('.filter-footer');
  const getApplyButton = (element) => element.querySelector('.apply-btn');
  const getResetButton = (element) => element.querySelector('.reset-btn');

  it('renders a title', () => {
    const element = renderComponent(CalendarDateFilter, getProps());
    assert.isNotNull(getTitle(element));
  });

  it('renders a date picker', () => {
    const element = renderComponent(CalendarDateFilter, getProps());
    assert.isNotNull(getDateRangePicker(element));
  });

  it('renders two input fields', () => {
    const element = renderComponent(CalendarDateFilter, getProps());
    assert.lengthOf(getDatePickerInputs(element), 2);
  });

  it('renders a footer', () => {
    const element = renderComponent(CalendarDateFilter, getProps());
    assert.isNotNull(getFooter(element));
  });

  it('disables the apply button if the date range is undefined', () => {
    const element = renderComponent(CalendarDateFilter, getProps({
      filter: {
        'function': 'timeRange',
        columnName: 'dinosaurTime',
        arguments: {
          start: null,
          end: null
        },
        isHidden: false
      }
    }));

    assert.isDefined($(getApplyButton(element)).attr('disabled'));
  });

  it('disables the apply button if the date range is identical to the existing date range', () => {
    const element = renderComponent(CalendarDateFilter, getProps());
    const input = getDatePickerInputs(element)[0];
    const originalValue = input.value;
    const applyButton = getApplyButton(element);

    assert.isDefined($(applyButton).attr('disabled'));

    input.value = '12/01/1400';
    Simulate.change(input);

    assert.isUndefined($(applyButton).attr('disabled'));

    input.value = originalValue;
    Simulate.change(input);

    assert.isDefined($(applyButton).attr('disabled'));
  });

  // NOTE: This is not the same behavior as NumberFilter, which has a test case
  // for this behavior under the "when changed" context.
  it('disables the apply button if the end date precedes the start date', () => {
    const element = renderComponent(CalendarDateFilter, getProps());
    const [start, end] = getDatePickerInputs(element);
    const applyButton = getApplyButton(element);

    start.value = '01/01/2000';
    Simulate.change(start);

    end.value = '01/01/1000';
    Simulate.change(end);

    assert.isDefined($(applyButton).attr('disabled'));
  });

  describe('when changed', () => {
    let spy;
    let element;
    let start;
    let end;

    beforeEach(() => {
      spy = sinon.spy();
      element = renderComponent(CalendarDateFilter, getProps({
        onUpdate: spy
      }));
      [start, end] = getDatePickerInputs(element);
    });

    it('updates the input to reflect the new range', () => {
      start.value = '01/01/1450';
      Simulate.change(start);

      Simulate.click(getApplyButton(element));

      const filter = spy.firstCall.args[0];
      assert.equal(filter.arguments.start, '1450-01-01T00:00:00');

      assert.equal(start.value, '01/01/1450');
    });

    it('allows ranges outside the min and max of the column', () => {
      start.value = '01/01/1000';
      Simulate.change(start);

      end.value = '01/01/2000';
      Simulate.change(end);

      Simulate.click(getApplyButton(element));

      const filter = spy.firstCall.args[0];
      assert.equal(filter.arguments.start, '1000-01-01T00:00:00');
      assert.equal(filter.arguments.end, '2000-01-01T23:59:59');

      assert.equal(start.value, '01/01/1000');
      assert.equal(end.value, '01/01/2000');
    });

    it('does not reset filter visibility when resetting values', () => {
      // mockTimeRangeFilter is set with isHidden: false
      // the "default" filter specifies isHidden: true

      Simulate.click(getResetButton(element));
      Simulate.click(getApplyButton(element));

      const filter = spy.firstCall.args[0];
      assert.isFalse(filter.isHidden);
    });
  });
});
