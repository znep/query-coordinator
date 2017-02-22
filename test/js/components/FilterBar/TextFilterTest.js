import _ from 'lodash';
import React from 'react';
import { renderIntoDocument, Simulate } from 'react-addons-test-utils';
import { renderComponent } from '../../helpers';
import TextFilter from 'components/FilterBar/TextFilter';
import { mockBinaryOperatorFilter, mockTextColumn } from './data';

describe('TextFilter', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      filter: {},
      column: {},
      onCancel: _.noop,
      onUpdate: _.noop
    });
  }

  it('renders an element', () => {
    const element = renderComponent(TextFilter, getProps());

    expect(element).to.exist;
  });


  it('removes a suggested option from suggestedOptions when it is selected', (done) => {
    const element = renderComponent(TextFilter, getProps({
      column: mockTextColumn,
      filter: mockBinaryOperatorFilter
    }));

    _.defer(() => {
      const selector = '.searchable-picklist-suggested-options .picklist-option';
      const suggestedOptionsLength = element.querySelectorAll(selector).length;

      Simulate.click(element.querySelector(selector));

      const suggestedOptionsNewLength = element.querySelectorAll(selector).length;

      assert.isBelow(suggestedOptionsNewLength, suggestedOptionsLength, 'Expected suggestedOptions to be smaller');

      done();
    });
  });

  it('removes a selected value from selectedOptions when it is selected', (done) => {
    const element = renderComponent(TextFilter, getProps({
      column: mockTextColumn,
      filter: mockBinaryOperatorFilter
    }));

    _.defer(() => {
      const selector = '.searchable-picklist-selected-options .picklist-option';
      const selectedOptionsLength = element.querySelectorAll(selector).length;

      Simulate.click(element.querySelector(selector));

      const selectedOptionsNewLength = element.querySelectorAll(selector).length;

      assert.isBelow(selectedOptionsNewLength, selectedOptionsLength, 'Expected selectedOptions to be smaller');

      done();
    });
  });


  describe('calls onUpdate with the new filter', () => {
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
      element = renderComponent(TextFilter, getProps({
        column: mockTextColumn,
        filter,
        onUpdate: onUpdateStub
      }));
    });

    it('creates a binaryOperator filter when the negation control is set to IS', (done) => {

      _.defer(() => {
        const selector = '.searchable-picklist-suggested-options .picklist-option';
        // Since clicking on picklist options mutates the picklist, we should select all the options we
        // want to click before we start clicking on them.
        const picklistOption1 = element.querySelector(selector);
        Simulate.click(picklistOption1);

        // Note that clicking on picklistOption1 mutated .searchable-picklist-suggested-options, so the second
        // option from before is now the first.
        const picklistOption2 = element.querySelector(selector);
        Simulate.click(picklistOption2);

        const applyButton = element.querySelector('.apply-btn');
        Simulate.click(applyButton);

        expect(onUpdateStub).to.have.been.calledWith({
          'function': 'binaryOperator',
          columnName: 'some_word',
          arguments: [
            {
              operator: 'IS NULL'
            },
            {
              operator: '=',
              operand: 'tyrannosaurus'
            }
          ],
          joinOn: 'OR',
          isHidden: false
        });

        done();
      });
    });

    it('creates a negated binaryOperator filter when the negation control is set to IS', (done) => {

      _.defer(() => {
        const selector = '.searchable-picklist-suggested-options .picklist-option';
        // Since clicking on picklist options mutates the picklist, we should select all the options we
        // want to click before we start clicking on them.
        const negationDropdownIsNotOption = element.querySelector('.text-filter-header .picklist-option[id="true-1"]');
        Simulate.click(negationDropdownIsNotOption);

        const picklistOption1 = element.querySelector(selector);
        Simulate.click(picklistOption1);

        // Note that clicking on picklistOption1 mutated .searchable-picklist-suggested-options, so the second
        // option from before is now the first.
        const picklistOption2 = element.querySelector(selector);
        Simulate.click(picklistOption2);

        const applyButton = element.querySelector('.apply-btn');
        Simulate.click(applyButton);

        expect(onUpdateStub).to.have.been.calledWith({
          'function': 'binaryOperator',
          columnName: 'some_word',
          arguments: [
            {
              operator: 'IS NOT NULL'
            },
            {
              operator: '!=',
              operand: 'tyrannosaurus'
            }
          ],
          joinOn: 'AND',
          isHidden: false
        });

        done();
      });
    });
  });

  describe('footer', () => {
    it('renders', () => {
      const element = renderComponent(TextFilter, getProps());

      expect(element.querySelector('.filter-footer')).to.exist;
    });

    it('clears selectedOptions when the clear button is clicked', (done) => {
      const filter = {
        'function': 'noop',
        columnName: mockTextColumn.fieldName,
        arguments: [
          {
            operator: '=',
            operand: 'tyrannosaurus'
          }
        ],
        isHidden: false
      };

      const onUpdateStub = sinon.stub();
      const onClickClear = sinon.stub();
      const element = renderComponent(TextFilter, getProps({
        filter,
        onClickClear: onClickClear,
        onUpdate: onUpdateStub,
        column: mockTextColumn
      }));

      _.defer(() => {
        const clearButton = element.querySelector('.clear-btn');
        Simulate.click(clearButton);

        const updateButton = element.querySelector('.apply-btn');
        Simulate.click(updateButton);

        expect(onUpdateStub).to.have.been.calledWith({
          'function': 'noop',
          columnName: mockTextColumn.fieldName,
          arguments: null,
          isHidden: false // visibility should NOT be reset when values are reset!
        });

        done();
      });
    });

    it('calls onCancel when cancel button is clicked', () => {
      const stub = sinon.stub();
      const element = renderComponent(TextFilter, getProps({
        onCancel: stub
      }));

      const button = element.querySelector('.cancel-btn');
      Simulate.click(button);

      expect(stub).to.have.been.called;
    });

    it('calls onUpdate with noop filter when the apply button with an empty array of selectedOptions', (done) => {
      const filter = {
        'function': 'noop',
        columnName: mockTextColumn.fieldName,
        arguments: [
          {
            operator: '=',
            operand: 'tyrannosaurus'
          }
        ],
        isHidden: false
      };

      const onUpdateStub = sinon.stub();
      const element = renderComponent(TextFilter, getProps({
        filter,
        onUpdate: onUpdateStub,
        column: mockTextColumn
      }));

      _.defer(() => {
        const picklistOption = element.querySelector('.searchable-picklist-selected-options .picklist-option');
        Simulate.click(picklistOption);

        const button = element.querySelector('.apply-btn');
        Simulate.click(button);

        expect(onUpdateStub).to.have.been.calledWith({
          'function': 'noop',
          columnName: mockTextColumn.fieldName,
          arguments: null,
          isHidden: false // visibility should NOT be reset when values are reset!
        });

        done();
      });
    });
  });
});
