import _ from 'lodash';
import { Simulate } from 'react-dom/test-utils';
import { renderComponent } from '../../helpers';
import TextFilter from 'components/FilterBar/TextFilter';
import { mockBinaryOperatorFilter, mockTextColumn } from './data';

describe('TextFilter', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      filter: {},
      column: {},
      spandex: {
        available: false,
        datasetUid: 'xxxx-xxxx',
        domain: 'example.com',
        provider: null
      },
      onClickConfig: _.noop,
      onRemove: _.noop,
      onUpdate: _.noop
    });
  }

  const getFirstOption = (el) => el.querySelector('.searchable-picklist-suggested-options .picklist-option');
  const getApplyButton = (el) => el.querySelector('.apply-btn');
  const getResetButton = (el) => el.querySelector('.reset-btn');

  it('renders an element', () => {
    const element = renderComponent(TextFilter, getProps());

    assert.isNotNull(element);
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

  describe('text input change', () => {
    const getSearchInput = (element) => element.querySelector('.searchable-picklist-input');
    const getSearchPrompt = (element) => element.querySelector('.alert.info');

    function simulateTextInput(element, searchTerm) {
      const searchInput = getSearchInput(element);
      searchInput.value = searchTerm;
      Simulate.change(searchInput);
    }

    describe('without Spandex autocomplete', () => {
      let fetchSuggestionsStub;
      let element;

      beforeEach(() => {
        fetchSuggestionsStub = sinon.stub().rejects();

        element = renderComponent(TextFilter, getProps({
          column: mockTextColumn,
          spandex: {
            available: false,
            provider: {
              fetchSuggestions: fetchSuggestionsStub
            }
          }
        }));
      });

      it('displays a message about exact match on change', () => {
        simulateTextInput(element, 'Example');
        assert.isNotNull(getSearchPrompt(element));
      });

      it('does not fetch autocomplete suggestions', () => {
        simulateTextInput(element, 'Example');
        sinon.assert.notCalled(fetchSuggestionsStub);
      });
    });

    describe('with Spandex autocomplete', () => {
      let fetchSuggestionsStub;
      let element;

      beforeEach(() => {
        fetchSuggestionsStub = sinon.stub().resolves([]);

        element = renderComponent(TextFilter, getProps({
          column: mockTextColumn,
          spandex: {
            available: true,
            provider: {
              fetchSuggestions: fetchSuggestionsStub
            }
          }
        }));
      });

      it('does not display a message about exact match on change', () => {
        simulateTextInput(element, 'Example');
        assert.isNull(getSearchPrompt(element));
      });

      it('fetches autocomplete suggestions', () => {
        simulateTextInput(element, 'Example');
        sinon.assert.calledOnce(fetchSuggestionsStub);
        sinon.assert.calledWith(fetchSuggestionsStub, 'dinosaurName', 'Example');
      });
    });
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
      element = renderComponent(TextFilter, getProps({
        column: mockTextColumn,
        filter,
        onUpdate: onUpdateStub
      }));
    });

    it('creates a binaryOperator filter when the negation control is set to IS', (done) => {
      _.defer(() => {

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
              operand: 'tyrannosaurus'
            }
          ],
          joinOn: 'OR',
          isHidden: false
        });

        done();
      });
    });

    it('creates a negated binaryOperator filter when the negation control is set to IS NOT', (done) => {
      _.defer(() => {

        // Since clicking on picklist options mutates the picklist, we should select all the options we
        // want to click before we start clicking on them.
        const negationDropdownIsNotOption = element.querySelector('.filter-control-title .picklist-option[id="true-1"]');
        Simulate.click(negationDropdownIsNotOption);

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

      assert.isNotNull(element.querySelector('.filter-footer'));
    });

    it('resets the filter when the reset button is clicked', (done) => {
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
      const onClickReset = sinon.stub();
      const element = renderComponent(TextFilter, getProps({
        filter,
        onClickReset: onClickReset,
        onUpdate: onUpdateStub,
        column: mockTextColumn
      }));

      _.defer(() => {
        Simulate.click(getResetButton(element));
        Simulate.click(getApplyButton(element));

        sinon.assert.calledWith(onUpdateStub, {
          'function': 'noop',
          columnName: mockTextColumn.fieldName,
          arguments: null,
          isHidden: false // visibility should NOT be reset when values are reset!
        });

        done();
      });
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

        Simulate.click(getApplyButton(element));

        sinon.assert.calledWith(onUpdateStub, {
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
