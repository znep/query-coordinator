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
      fetchSuggestions: _.constant(Promise.resolve([])),
      onCancel: _.noop,
      onUpdate: _.noop
    });
  }

  it('renders an element', () => {
    const element = renderComponent(TextFilter, getProps());

    expect(element).to.exist;
  });

  it('invokes fetchSuggestions on load', () => {
    const stub = sinon.stub().returns(Promise.resolve([]));
    const element = renderComponent(TextFilter, getProps({
      fetchSuggestions: stub
    }));

    expect(stub).to.have.been.called;
  });

  it('sets hasSearchError to false when request succeeds', (done) => {
    const fetchSuggestions = _.constant(Promise.resolve([]));
    const instance = React.createElement(TextFilter, getProps({
      fetchSuggestions
    }));
    const component = renderIntoDocument(instance);

    _.defer(() => {
      expect(component.state.hasSearchError).to.eq(false);
      done();
    });
  });

  it('sets hasSearchError to true when request errors', (done) => {
    const fetchSuggestions = _.constant(Promise.reject());
    const instance = React.createElement(TextFilter, getProps({
      fetchSuggestions
    }));
    const component = renderIntoDocument(instance);

    _.defer(() => {
      expect(component.state.hasSearchError).to.eq(true);
      done();
    });
  });

  it('sets hasSearchError to true when request is not an array', (done) => {
    const fetchSuggestions = _.constant(Promise.resolve({}));
    const instance = React.createElement(TextFilter, getProps({
      fetchSuggestions
    }));
    const component = renderIntoDocument(instance);

    _.defer(() => {
      expect(component.state.hasSearchError).to.eq(true);
      done();
    });
  });

  it('renders a searchable picklist when results are returned', (done) => {
    const results = ['suggestion1', 'suggestion2'];
    const element = renderComponent(TextFilter, getProps({
      fetchSuggestions: sinon.stub().returns(Promise.resolve(results))
    }));

    _.defer(() => {
      const picklistOptions = element.querySelectorAll('.picklist-suggested-options .picklist-option');
      // We prepend a 'No Value' option to the picklist outside the context of
      // the suggestions, so two suggestions from fetchSuggestions will result
      // in three picklist options.
      assert.equal(picklistOptions.length, 3);
      assert.deepEqual(_.map(picklistOptions, 'innerText'), ['(No value)', results[0], results[1]]);
      done();
    });
  });

  it('removes a suggested option from suggestedOptions when it is selected', (done) => {
    const results = ['suggestion1', 'suggestion2'];
    const element = renderComponent(TextFilter, getProps({
      fetchSuggestions: sinon.stub().returns(Promise.resolve(results)),
      column: mockTextColumn,
      filter: mockBinaryOperatorFilter
    }));

    _.defer(() => {
      const suggestedOptionsLength = element.querySelectorAll('.picklist-suggested-options .picklist-option').length;

      Simulate.click(element.querySelector('.picklist-suggested-options .picklist-option'));

      const suggestedOptionsNewLength = element.querySelectorAll('.picklist-suggested-options .picklist-option').length;

      assert.isBelow(suggestedOptionsNewLength, suggestedOptionsLength, 'Expected suggestedOptions to be smaller');

      done();
    });
  });

  it('removes a selected value from selectedOptions when it is selected', (done) => {
    const results = [];
    const element = renderComponent(TextFilter, getProps({
      fetchSuggestions: sinon.stub().returns(Promise.resolve(results)),
      column: mockTextColumn,
      filter: mockBinaryOperatorFilter
    }));

    _.defer(() => {
      const selectedOptionsLength = element.querySelectorAll('.picklist-selected-options .picklist-option').length;

      Simulate.click(element.querySelector('.picklist-selected-options .picklist-option'));

      const selectedOptionsNewLength = element.querySelectorAll('.picklist-selected-options .picklist-option').length;

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
    const results = ['penguin'];

    let fetchSuggestionsStub;
    let onUpdateStub;
    let element;

    beforeEach(() => {
      fetchSuggestionsStub = sinon.stub().returns(Promise.resolve(results));
      onUpdateStub = sinon.stub();
      element = renderComponent(TextFilter, getProps({
        filter,
        onUpdate: onUpdateStub,
        fetchSuggestions: fetchSuggestionsStub
      }));
    });

    it('creates a binaryOperator filter when the negation control is set to IS', (done) => {

      _.defer(() => {
        // Since clicking on picklist options mutates the picklist, we should select all the options we
        // want to click before we start clicking on them.
        const picklistOption1 = element.querySelector('.picklist-suggested-options .picklist-option');
        Simulate.click(picklistOption1);

        // Note that clicking on picklistOption1 mutated .picklist-suggested-options, so the second
        // option from before is now the first.
        const picklistOption2 = element.querySelector('.picklist-suggested-options .picklist-option');
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
              operand: 'penguin'
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
        // Since clicking on picklist options mutates the picklist, we should select all the options we
        // want to click before we start clicking on them.
        const negationDropdownIsNotOption = element.querySelector('.text-filter-header .picklist-option[id="true-1"]');
        Simulate.click(negationDropdownIsNotOption);

        const picklistOption1 = element.querySelector('.picklist-suggested-options .picklist-option');
        Simulate.click(picklistOption1);

        // Note that clicking on picklistOption1 mutated .picklist-suggested-options, so the second
        // option from before is now the first.
        const picklistOption2 = element.querySelector('.picklist-suggested-options .picklist-option');
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
              operand: 'penguin'
            }
          ],
          joinOn: 'AND',
          isHidden: false
        });

        done();
      });
    });
  });

  it('invokes fetchSuggestions when the search term changes', () => {
    const clock = sinon.useFakeTimers();
    const stub = sinon.stub().returns(Promise.resolve([]));
    const element = renderComponent(TextFilter, getProps({
      fetchSuggestions: stub
    }));

    const search = element.querySelector('input');
    search.value = 'corgi palace';
    Simulate.change(search);

    clock.tick(650);

    sinon.assert.calledTwice(stub);

    clock.restore();
  });

  describe('footer', () => {
    it('renders', () => {
      const element = renderComponent(TextFilter, getProps());

      expect(element.querySelector('.filter-footer')).to.exist;
    });

    it('invokes fetchSuggestions when the clear button is clicked', () => {
      const clock = sinon.useFakeTimers();
      const stub = sinon.stub().returns(Promise.resolve([]));
      const element = renderComponent(TextFilter, getProps({
        fetchSuggestions: stub
      }));

      const search = element.querySelector('input');
      search.value = 'corgi disaster';
      Simulate.change(search);
      clock.tick(500);
      Simulate.click(element.querySelector('.clear-btn'));
      clock.tick(500);

      sinon.assert.calledThrice(stub); // once on load, once on search, once on clear

      clock.restore();
    });

    it('clears selectedOptions when the clear button is clicked', (done) => {
      const filter = {
        'function': 'noop',
        columnName: mockTextColumn.fieldName,
        arguments: [
          {
            operator: '=',
            operand: 'penguin'
          }
        ],
        isHidden: false
      };

      const onUpdateStub = sinon.stub();
      const onClickClear = sinon.stub();
      const fetchSuggestionsStub = sinon.stub().returns(Promise.resolve([]));
      const element = renderComponent(TextFilter, getProps({
        filter,
        onClickClear: onClickClear,
        onUpdate: onUpdateStub,
        fetchSuggestions: fetchSuggestionsStub,
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
            operand: 'penguin'
          }
        ],
        isHidden: false
      };

      const onUpdateStub = sinon.stub();
      const fetchSuggestionsStub = sinon.stub().returns(Promise.resolve([]));
      const element = renderComponent(TextFilter, getProps({
        filter,
        onUpdate: onUpdateStub,
        fetchSuggestions: fetchSuggestionsStub,
        column: mockTextColumn
      }));

      _.defer(() => {
        const picklistOption = element.querySelector('.picklist-selected-options .picklist-option');
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
