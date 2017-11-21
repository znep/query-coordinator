import _ from 'lodash';
import { Simulate } from 'react-dom/test-utils';
import { renderComponent } from '../../helpers';
import CheckboxFilter from 'components/FilterBar/FilterEditor/CheckboxFilter';
import { mockBinaryOperatorFilter, mockCheckboxColumn } from './data';

describe('CheckboxFilter', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      filter: {},
      column: {},
      onClickConfig: _.noop,
      onRemove: _.noop,
      onUpdate: _.noop
    });
  }

  const getFirstOption = (el) => el.querySelector('.searchable-picklist-suggested-options .picklist-option');
  const getApplyButton = (el) => el.querySelector('.apply-btn');
  const getResetButton = (el) => el.querySelector('.reset-btn');

  it('renders an element', () => {
    const element = renderComponent(CheckboxFilter, getProps());
    assert.isNotNull(element);
  });

  it('removes a suggested option from suggestedOptions when it is selected', () => {
    const element = renderComponent(CheckboxFilter, getProps({
      column: mockCheckboxColumn
    }));

    // Initially there are 0 items in the selected picklist
    const selectedOptionsSelector = '.searchable-picklist-selected-options .picklist-option';
    const selectedOptionsLength = element.querySelectorAll(selectedOptionsSelector).length;
    assert.equal(selectedOptionsLength, 0, 'selectedOptionsLength');

    // Initially there are 3 items in the suggested picklist: (no value), True, and False
    const suggestedOptionsSelector = '.searchable-picklist-suggested-options .picklist-option';
    const suggestedOptionsLength = element.querySelectorAll(suggestedOptionsSelector).length;
    assert.equal(suggestedOptionsLength, 3, 'suggestedOptionsLength');

    Simulate.click(element.querySelector(suggestedOptionsSelector));

    // Should be 1 items in the selected picklist
    const selectedOptionsNewLength = element.querySelectorAll(selectedOptionsSelector).length;
    assert.equal(selectedOptionsNewLength, 1, 'selectedOptionsNewLength');

    // Should be 2 items in the suggested picklist
    const suggestedOptionsNewLength = element.querySelectorAll(suggestedOptionsSelector).length;
    assert.equal(suggestedOptionsNewLength, 2, 'suggestedOptionsNewLength');
  });

  it('removes a selected value from selectedOptions when it is selected', () => {
    const element = renderComponent(CheckboxFilter, getProps({
      column: mockCheckboxColumn,
      filter: mockBinaryOperatorFilter
    }));

    const selector = '.searchable-picklist-selected-options .picklist-option';
    const selectedOptionsLength = element.querySelectorAll(selector).length;

    Simulate.click(element.querySelector(selector));

    const selectedOptionsNewLength = element.querySelectorAll(selector).length;
    assert.isBelow(selectedOptionsNewLength, selectedOptionsLength, 'Expected selectedOptions to be smaller');
  });

  describe('filter generation', () => {
    const filter = {
      'function': 'noop',
      columnName: 'some_word',
      arguments: null,
      isHidden: false
    };

    let onUpdateStub;
    let element;

    beforeEach(() => {
      onUpdateStub = sinon.stub();
      element = renderComponent(CheckboxFilter, getProps({
        column: mockCheckboxColumn,
        filter,
        onUpdate: onUpdateStub
      }));
    });

    it('creates a binaryOperator filter when the negation control is set to IS', () => {
      // Selecting an option removes it from the list, so clicking the first option twice will
      // select two options.
      Simulate.click(getFirstOption(element));
      Simulate.click(getFirstOption(element));

      Simulate.click(getApplyButton(element));

      sinon.assert.calledWith(onUpdateStub, {
        'function': 'binaryOperator',
        columnName: 'some_word',
        arguments: [
          {
            operator: 'IS NULL'
          },
          {
            operator: '=',
            operand: true
          }
        ],
        joinOn: 'OR',
        isHidden: false
      });
    });
  });

  describe('footer', () => {
    it('renders', () => {
      const element = renderComponent(CheckboxFilter, getProps());

      assert.isNotNull(element.querySelector('.filter-footer'));
    });

    it('resets the filter when the reset button is clicked', () => {
      const filter = {
        'function': 'noop',
        columnName: mockCheckboxColumn.fieldName,
        arguments: [
          {
            operator: '=',
            operand: true
          }
        ],
        isHidden: false
      };

      const onUpdateStub = sinon.stub();
      const onClickReset = sinon.stub();
      const element = renderComponent(CheckboxFilter, getProps({
        filter,
        onClickReset: onClickReset,
        onUpdate: onUpdateStub,
        column: mockCheckboxColumn
      }));

      Simulate.click(getResetButton(element));
      Simulate.click(getApplyButton(element));

      sinon.assert.calledWith(onUpdateStub, {
        'function': 'noop',
        columnName: mockCheckboxColumn.fieldName,
        arguments: null,
        isHidden: false // visibility should NOT be reset when values are reset!
      });
    });

    it('calls onUpdate with noop filter when the apply button with an empty array of selectedOptions', () => {
      const filter = {
        'function': 'noop',
        columnName: mockCheckboxColumn.fieldName,
        arguments: [
          {
            operator: '=',
            operand: true
          }
        ],
        isHidden: false
      };

      const onUpdateStub = sinon.stub();
      const element = renderComponent(CheckboxFilter, getProps({
        filter,
        onUpdate: onUpdateStub,
        column: mockCheckboxColumn
      }));

      const picklistOption = element.querySelector('.searchable-picklist-selected-options .picklist-option');
      Simulate.click(picklistOption);

      Simulate.click(getApplyButton(element));

      sinon.assert.calledWith(onUpdateStub, {
        'function': 'noop',
        columnName: mockCheckboxColumn.fieldName,
        arguments: null,
        isHidden: false // visibility should NOT be reset when values are reset!
      });
    });
  });
});
