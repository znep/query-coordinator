import $ from 'jquery';
import _ from 'lodash';
import React from 'react';
import { shallow } from 'enzyme';
import { Simulate } from 'react-dom/test-utils';
import { renderComponent } from '../../helpers';
import FilterHeader from 'components/FilterBar/FilterHeader';
import FilterFooter from 'components/FilterBar/FilterFooter';
import Slider from 'components/Slider';
import NumberFilter from 'components/FilterBar/FilterEditor/NumberFilter';
import { mockValueRangeFilter, mockNumberColumn } from './data';

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

  it('renders a header', () => {
    const element = shallow(<NumberFilter {...getProps()} />);
    assert.lengthOf(element.find(FilterHeader), 1);
  });

  it('renders a slider', () => {
    const element = shallow(<NumberFilter {...getProps()} />);
    assert.lengthOf(element.find(Slider), 1);
  });

  it('renders the include-nulls-toggle checkbox', () => {
    let element = shallow(<NumberFilter {...getProps()} />);
    assert.lengthOf(element.find('.include-nulls-toggle'), 1);
  });

  it('renders a footer', () => {
    const element = shallow(<NumberFilter {...getProps()} />);
    assert.lengthOf(element.find(FilterFooter), 1);
  });

  it('computes the proper step based on the minimum precision of the range', () => {
    const element = shallow(<NumberFilter {...getProps()} />);
    const inputs = element.find('.range-input');
    assert.lengthOf(inputs, 2);
    assert.equal(inputs.at(0).prop('step'), '0.01');
    assert.equal(inputs.at(1).prop('step'), '0.01');
  });

  // These tests actually render the element because they rely on browser-native <input>
  // behavior (i.e., no Enzyme here).
  describe('when changed', () => {
    let spy;
    let element;
    let start;
    let end;

    const getApplyButton = (element) => element.querySelector('.apply-btn');
    const getResetButton = (element) => element.querySelector('.reset-btn');
    const getInputs = (element) => element.querySelectorAll('.range-input');
    const getIncludeNullsToggle = (element) => element.querySelector('.include-nulls-toggle');

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
      const checkbox = getIncludeNullsToggle(element);
      Simulate.change(checkbox, { target: { checked: false } });
      Simulate.click(getApplyButton(element));
      const filter = spy.firstCall.args[0];

      assert.isNotTrue(checkbox.hasAttribute('checked'));
      assert.equal(filter.arguments.includeNullValues, false);
    });
  });
});
