import $ from 'jquery';
import _ from 'lodash';
import React from 'react';
import { shallow } from 'enzyme';
import { Simulate } from 'react-dom/test-utils';
import { renderComponent } from '../../helpers';
import FilterHeader from 'components/FilterBar/FilterHeader';
import FilterFooter from 'components/FilterBar/FilterFooter';
import Slider from 'components/Slider';
import Dropdown from 'components/Dropdown';
import NumberFilter from 'components/FilterBar/FilterEditor/NumberFilter';
import * as data from './data';

describe('NumberFilter', () => {
  function getProps(props) {
    return {
      filter: data.mockRangeInclusiveFilter,
      column: data.mockNumberColumn,
      onClickConfig: _.noop,
      onRemove: _.noop,
      onUpdate: _.noop,
      ...props
    };
  }

  it('renders a header', () => {
    const element = shallow(<NumberFilter {...getProps()} />);
    assert.lengthOf(element.find(FilterHeader), 1);
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
    // For some silly definition of "proper".
    const element = shallow(<NumberFilter {...getProps()} />);
    const inputs = element.find('.range-input');
    assert.lengthOf(inputs, 2);
    assert.equal(inputs.at(0).prop('step'), '0.01');
    assert.equal(inputs.at(1).prop('step'), '0.01');
  });

  describe('legacy valueRange filters', () => {
    describe('with includeNullValues not set', () => {
      it('migrates to rangeInclusive with only start and end set in arguments', () => {
        const filter = _.cloneDeep(data.mockValueRangeFilter);
        delete filter.arguments.includeNullValues;

        const spy = sinon.spy();
        const props = getProps({ filter, onUpdate: spy });
        const element = shallow(<NumberFilter {...props} />);
        element.find(FilterFooter).prop('onClickApply')();
        const migratedFilter = spy.args[0][0];
        assert.propertyVal(migratedFilter, 'function', 'rangeInclusive');
        assert.propertyVal(migratedFilter, 'columnName', data.mockValueRangeFilter.columnName);
        assert.deepPropertyVal(migratedFilter, 'arguments.start', '1'); // Yes, string.
        assert.deepPropertyVal(migratedFilter, 'arguments.end', '3'); // Yes, string.
        assert.notDeepProperty(migratedFilter, 'arguments.includeNullValues');
      });
    });

    describe('with includeNullValues set to true', () => {
      it('migrates to rangeInclusive with includeNullValues preserved', () => {
        const filter = _.cloneDeep(data.mockValueRangeFilter);
        filter.arguments.includeNullValues = true;

        const spy = sinon.spy();
        const props = getProps({ filter, onUpdate: spy });
        const element = shallow(<NumberFilter {...props} />);
        element.find(FilterFooter).prop('onClickApply')();
        const migratedFilter = spy.args[0][0];
        assert.deepPropertyVal(migratedFilter, 'arguments.includeNullValues', true);
      });
    });

    describe('with includeNullValues set to false', () => {
      it('migrates to rangeInclusive with includeNullValues preserved', () => {
        const filter = _.cloneDeep(data.mockValueRangeFilter);
        filter.arguments.includeNullValues = false;

        const spy = sinon.spy();
        const props = getProps({ filter, onUpdate: spy });
        const element = shallow(<NumberFilter {...props} />);
        element.find(FilterFooter).prop('onClickApply')();
        const migratedFilter = spy.args[0][0];
        assert.deepPropertyVal(migratedFilter, 'arguments.includeNullValues', false);
      });
    });
  });

  describe('function dropdown', () => {
    const renderEmptyFilter = () => {
      const element = shallow(<NumberFilter {...getProps({ filter: {} })} />);
      const dropdown = element.find(Dropdown);
      return { element, dropdown };
    };

    it('presents the expected options', () => {
      // This is basically hardcoded in the code, so there's not much to verify.
      // We're basically doing this for test sanity below; we're going to pass
      // in mocked option values below.
      const { dropdown } = renderEmptyFilter();
      const options = dropdown.prop('options');
      assert.deepEqual(
        _.map(options, 'value'),
        ['<', '<=', '>', '>=', 'rangeExclusive', 'rangeInclusive']
      );
    });

    it('is cleared by default', () => {
      const { dropdown } = renderEmptyFilter();
      assert.isUndefined(dropdown.prop('value'));
    });

    const itDefaultsRange = (func) => {
      describe(func, () => {
        it('defaults range to column extents', () => {
          const { element, dropdown } = renderEmptyFilter();
          dropdown.prop('onSelection')({ value: func });

          assert.equal(element.find('input#start').prop('value'), data.mockNumberColumn.rangeMin);
          assert.equal(element.find('input#end').prop('value'), data.mockNumberColumn.rangeMax);
        });
      });
    };

    itDefaultsRange('rangeInclusive');
    itDefaultsRange('rangeExclusive');

    const itDefaultsValue = (func) => {
      describe(func, () => {
        it('defaults value to column minimum', () => {
          const { element, dropdown } = renderEmptyFilter();
          dropdown.prop('onSelection')({ value: func });

          assert.equal(element.find('input#value').prop('value'), data.mockNumberColumn.rangeMin);
        });
      });
    };

    itDefaultsValue('<');
    itDefaultsValue('<=');
    itDefaultsValue('>');
    itDefaultsValue('>=');
  });

  describe('input boxes', () => {
    let element;

    const givenFilter = (filter, callback) => {
      describe(filter.function || 'empty', () => {
        beforeEach(() => {
          element = shallow(<NumberFilter {...getProps({ filter })} />);
        });
        callback();
      });
    };

    const itRendersStartEndInputs = () => {
      it('renders a start and end input box', () => {
        assert.lengthOf(element.find('input[type="number"]'), 2);
        assert.lengthOf(element.find('input#start'), 1);
        assert.lengthOf(element.find('input#end'), 1);
      });
    };

    const itRendersSingleInput = () => {
      it('renders only a single value input', () => {
        assert.lengthOf(element.find('input[type="number"]'), 1);
        assert.lengthOf(element.find('input#value'), 1);
      });
    };

    const itRendersNoInputs = () => {
      it('renders no inputs', () => {
        assert.lengthOf(element.find('input[type="number"]'), 0);
      });
    };

    givenFilter(data.mockValueRangeFilter, itRendersStartEndInputs);
    givenFilter(data.mockRangeInclusiveFilter, itRendersStartEndInputs);
    givenFilter(data.mockRangeExclusiveFilter, itRendersStartEndInputs);
    givenFilter(data.mockGTFilter, itRendersSingleInput);
    givenFilter(data.mockGTEFilter, itRendersSingleInput);
    givenFilter(data.mockLTFilter, itRendersSingleInput);
    givenFilter(data.mockLTEFilter, itRendersSingleInput);
    givenFilter({}, itRendersNoInputs);
  });

  // These tests actually render the element because they rely on browser-native <input>
  // behavior (i.e., no Enzyme here).
  describe('when changed', () => {
    const getApplyButton = (element) => element.querySelector('.apply-btn');
    const getResetButton = (element) => element.querySelector('.reset-btn');
    const getIncludeNullsToggle = (element) => element.querySelector('.include-nulls-toggle');
    const getStartInput = (element) => element.querySelector('input#start');
    const getEndInput = (element) => element.querySelector('input#end');
    const getValueInput = (element) => element.querySelector('input#value');

    describe('range filter', () => {
      it('disables the apply button if the range is identical to the existing range', () => {
        const element = renderComponent(NumberFilter, getProps());
        const startInput = getStartInput(element);
        const startOriginalValue = startInput.value;
        const endInput = getEndInput(element);
        const endOriginalValue = endInput.value;

        const assertDisabled = () => assert.isDefined($(getApplyButton(element)).attr('disabled'));
        const assertEnabled = () => assert.isUndefined($(getApplyButton(element)).attr('disabled'));

        assertDisabled();

        // Start changed.
        startInput.value = 2;
        Simulate.change(startInput);
        assertEnabled();

        // Back to original.
        startInput.value = startOriginalValue;
        Simulate.change(startInput);
        assertDisabled();

        // End changed.
        endInput.value = 50;
        Simulate.change(endInput);
        assertEnabled();

        // Back to original.
        endInput.value = endOriginalValue;
        Simulate.change(endInput);
        assertDisabled();

        // Both changed.
        endInput.value = 50;
        Simulate.change(endInput);
        startInput.value = 2;
        Simulate.change(startInput);
        assertEnabled();

        // Back to original.
        endInput.value = endOriginalValue;
        Simulate.change(endInput);
        startInput.value = startOriginalValue;
        Simulate.change(startInput);
        assertDisabled();
      });

      it('swaps the start and end of the range if necessary', () => {
        const spy = sinon.spy();
        const element = renderComponent(NumberFilter, getProps({
          onUpdate: spy
        }));
        const startInput = getStartInput(element);
        const endInput = getEndInput(element);

        startInput.value = 2000;
        Simulate.change(startInput);
        endInput.value = 2;
        Simulate.change(endInput);

        Simulate.click(getApplyButton(element));

        const filter = spy.firstCall.args[0];
        assert.equal(filter.arguments.start, '2');
        assert.equal(filter.arguments.end, '2000');
      });
    });

    describe('single-value functions', () => {
      it('disables the apply button if the value is identical to the existing value', () => {
        const element = renderComponent(NumberFilter, getProps({ filter: data.mockGTFilter }));
        const input = getValueInput(element);
        const originalValue = input.value;

        const assertDisabled = () => assert.isDefined($(getApplyButton(element)).attr('disabled'));
        const assertEnabled = () => assert.isUndefined($(getApplyButton(element)).attr('disabled'));

        assertDisabled();

        // End changed.
        input.value = 50;
        Simulate.change(input);
        assertEnabled();

        // Back to original.
        input.value = originalValue;
        Simulate.change(input);
        assertDisabled();
      });
    });

    it('does not reset filter visibility when resetting values', () => {
      const spy = sinon.spy();
      const element = renderComponent(NumberFilter, getProps({
        onUpdate: spy,
        filter: data.mockRangeInclusiveFilter
      }));
      // mockRangeInclusiveFilter is set with isHidden: false
      assert.isFalse(data.mockRangeInclusiveFilter.isHidden);
      // the "default" filter specifies isHidden: true

      Simulate.click(getResetButton(element));
      Simulate.click(getApplyButton(element));

      const filter = spy.firstCall.args[0];
      assert.isFalse(filter.isHidden);
    });

    it('updates filter with new includeNullValues value when checkbox clicked', () => {
      const spy = sinon.spy();
      const element = renderComponent(NumberFilter, getProps({
        onUpdate: spy
      }));

      const checkbox = getIncludeNullsToggle(element);
      Simulate.change(checkbox, { target: { checked: false } });
      Simulate.click(getApplyButton(element));

      const filter = spy.firstCall.args[0];

      assert.isNotTrue(checkbox.hasAttribute('checked'));
      assert.equal(filter.arguments.includeNullValues, false);
    });
  });
});
