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
      const picklistOptions = element.querySelectorAll('.picklist-option');
      expect(picklistOptions.length).to.eq(2);
      _.each(picklistOptions, function(option, index) {
        expect(option.innerText).to.eq(results[index]);
      });
      done();
    });
  });

  it('removes a selected value from selectedValues when it is selected', () => {
    const stub = sinon.stub().returns(Promise.resolve([]));
    const element = renderComponent(TextFilter, getProps({
      fetchSuggestions: stub,
      column: mockTextColumn,
      filter: mockBinaryOperatorFilter
    }));

    const selectedValuesLength = element.querySelectorAll('.picklist-title').length;

    Simulate.click(element.querySelector('.picklist-title'));

    const selectedValuesNewLength = element.querySelectorAll('.picklist-title').length;

    assert(selectedValuesNewLength < selectedValuesLength, 'Expected selectedValues to be smaller');
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

    it('clears selectedValues when the clear button is clicked', (done) => {
      const filter = {
        'function': 'noop',
        columnName: mockTextColumn.fieldName,
        arguments: [
          {
            operator: "=",
            operand: "penguin"
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
          isHidden: true
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

    it('calls onUpdate with the new filter when the apply button is used', (done) => {
      const filter = {
        'function': 'noop',
        columnName: 'some_word',
        arguments: null,
        isHidden: false
      };
      const results = ['penguin'];
      const fetchSuggestionsStub = sinon.stub().returns(Promise.resolve(results));
      const onUpdateStub = sinon.stub();
      const element = renderComponent(TextFilter, getProps({
        filter,
        onUpdate: onUpdateStub,
        fetchSuggestions: fetchSuggestionsStub
      }));

      _.defer(() => {
        const picklistOption = element.querySelector('.picklist-option');
        Simulate.click(picklistOption);

        const button = element.querySelector('.apply-btn');
        Simulate.click(button);

        expect(onUpdateStub).to.have.been.calledWith({
          'function': 'binaryOperator',
          columnName: 'some_word',
          arguments: [
            {
              operator: "=",
              operand: "penguin"
            }
          ],
          isHidden: false
        });

        done();
      });
    });

    it('calls onUpdate with noop filter when the apply button with an empty array of selectedValues', (done) => {
      const filter = {
        'function': 'noop',
        columnName: mockTextColumn.fieldName,
        arguments: [
          {
            operator: "=",
            operand: "penguin"
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
        const picklistOption = element.querySelector('.picklist-option');
        Simulate.click(picklistOption);

        const button = element.querySelector('.apply-btn');
        Simulate.click(button);

        expect(onUpdateStub).to.have.been.calledWith({
          'function': 'noop',
          columnName: mockTextColumn.fieldName,
          arguments: null,
          isHidden: true
        });

        done();
      });
    });
  });
});
