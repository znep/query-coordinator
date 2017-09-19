import _ from 'lodash';
import NumberFilter from 'components/FilterBar/NumberFilter';
import { mockValueRangeFilter, mockNumberColumn } from './data';
import { Simulate } from 'react-dom/test-utils';
import { renderComponent } from '../../helpers';
import $ from 'jquery';

describe('NumberFilter', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      filter: mockValueRangeFilter,
      column: mockNumberColumn,
      onClickConfig: _.noop,
      onRemove: _.noop,
      onUpdate: _.noop
    });
  }

  const getTitle = (element) => element.querySelector('.filter-control-title');
  const getSlider = (element) => element.querySelector('.input-range-slider');
  const getInputs = (element) => element.querySelectorAll('.range-input');
  const getCheckbox = (element) => element.querySelector('.include-nulls-toggle');
  const getFooter = (element) => element.querySelector('.filter-footer');
  const getApplyButton = (element) => element.querySelector('.apply-btn');
  const getResetButton = (element) => element.querySelector('.reset-btn');

  it('renders a title', () => {
    const element = renderComponent(NumberFilter, getProps());
    assert.isNotNull(getTitle(element));
  });

  it('renders a slider', () => {
    const element = renderComponent(NumberFilter, getProps());
    assert.isNotNull(getSlider(element));
  });

  it('renders two input fields', () => {
    const element = renderComponent(NumberFilter, getProps());
    assert.lengthOf(getInputs(element), 2);
  });

  it('renders a checkbox', () => {
    const element = renderComponent(NumberFilter, getProps());
    assert.isNotNull(getCheckbox(element));
  });

  it('renders a footer', () => {
    const element = renderComponent(NumberFilter, getProps());
    assert.isNotNull(getFooter(element));
  });

  it('computes the proper step based on the minimum precision of the range', () => {
    const element = renderComponent(NumberFilter, getProps());
    const inputs = getInputs(element);
    assert.deepEqual(_.map(inputs, 'step'), ['0.01', '0.01']);
  });

  it('disables the apply button if the range is identical to the existing range', () => {
    const element = renderComponent(NumberFilter, getProps());
    const input = getInputs(element)[0];
    const originalValue = input.value;

    assert.isDefined($(getApplyButton(element)).attr('disabled'));

    input.value = 2;
    Simulate.change(input);

    assert.isUndefined($(getApplyButton(element)).attr('disabled'));

    input.value = originalValue;
    Simulate.change(input);

    assert.isDefined($(getApplyButton(element)).attr('disabled'));
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
      assert.equal(filter.arguments.start, 2);

      assert.equal(start.value, '2');
    });

    it('allows ranges outside the min and max of the column', () => {
      start.value = -200;
      Simulate.change(start);

      end.value = 2000;
      Simulate.change(end);

      Simulate.click(getApplyButton(element));

      const filter = spy.firstCall.args[0];
      assert.equal(filter.arguments.start, -200);
      assert.equal(filter.arguments.end, 2000.0001);

      assert.equal(start.value, '-200');
      assert.equal(end.value, '2000');
    });

    it('generates filters that have a small amount added to the end of the range', () => {
      start.value = 1.01;
      Simulate.change(start);

      end.value = 2.4;
      Simulate.change(end);

      Simulate.click(getApplyButton(element));

      // Since the smallest precision is .01, the end of the range will have .0001 added to it.
      const filter = spy.firstCall.args[0];
      assert.equal(filter.arguments.start, 1.01);
      assert.equal(filter.arguments.end, 2.4001);
    });

    it('swaps the start and end of the range if necessary', () => {
      start.value = 10;
      Simulate.change(start);

      end.value = 1;
      Simulate.change(end);

      Simulate.click(getApplyButton(element));

      const filter = spy.firstCall.args[0];
      assert.equal(filter.arguments.start, 1);
      assert.equal(filter.arguments.end, 10.0001);
    });

    it('does not reset filter visibility when resetting values', () => {
      // mockValueRangeFilter is set with isHidden: false
      // the "default" filter specifies isHidden: true

      Simulate.click(getResetButton(element));
      Simulate.click(getApplyButton(element));

      const filter = spy.firstCall.args[0];
      assert.isFalse(filter.isHidden);
    });

    it('updates filter with new includeNullValues value when checkbox clicked', () => {
      const checkbox = getCheckbox(element);
      Simulate.change(checkbox, { target: { checked: false } })
      Simulate.click(getApplyButton(element));
      const filter = spy.firstCall.args[0];

      assert.isNotTrue(checkbox.hasAttribute('checked'));
      assert.equal(filter.arguments.includeNullValues, false);
    });
  });
});
