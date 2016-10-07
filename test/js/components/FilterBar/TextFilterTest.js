import _ from 'lodash';
import React from 'react';
import { Simulate } from 'react-addons-test-utils';
import TextFilter from 'components/FilterBar/TextFilter';

describe('TextFilter', () => {
  function getProps(props) {
    return _.defaultsDeep({}, props, {
      filter: {},
      column: {},
      fetchSuggestions: _.constant(Promise.resolve([]))
    });
  }

  it('renders an element', () => {
    const element = renderComponent(TextFilter, getProps());

    expect(element).to.exist;
  });

  it('invokes fetchSuggestions on load', () => {
    const stub = sinon.stub().returns({ then: (callback) => callback([]) });
    const element = renderComponent(TextFilter, getProps({
      fetchSuggestions: stub
    }));

    expect(stub).to.have.been.called;
  });

  it('displays a spinner on first load', () => {
    const element = renderComponent(TextFilter, getProps({
      fetchSuggestions: sinon.stub().returns({ then: () => null })
    }));

    expect(element.querySelector('.spinner')).to.exist;
  });

  it('renders a searchable picklist when results returned', () => {
    const results = ['suggestion1', 'suggestion2'];
    const element = renderComponent(TextFilter, getProps({
      fetchSuggestions: sinon.stub().returns({ then: (callback) => callback(results) })
    }));
    const picklistOptions = element.querySelectorAll('.picklist-option');

    expect(picklistOptions.length).to.eq(2);
    expect(element.querySelector('.spinner')).to.not.exist;
  });

  it('invokes fetchSuggestions when the search term changes', () => {
    const stub = sinon.stub().returns({ then: (callback) => callback([]) });
    const element = renderComponent(TextFilter, getProps({
      fetchSuggestions: stub
    }));

    const search = element.querySelector('input');
    search.value = 'corgi palace';
    Simulate.change(search);

    expect(stub).to.have.been.calledTwice; // once on load, once on search
  });

  describe('footer', () => {
    it('renders', () => {
      const element = renderComponent(TextFilter, getProps());

      expect(element.querySelector('.filter-footer')).to.exist;
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

    it('calls onUpdate with the new filter when apply button used', () => {
      const filter = {
        parameters: {
          'function': 'binaryOperator',
          columnName: 'some_word',
          arguments: {
            operator: '=',
            operand: null
          }
        }
      };
      const results = ['penguin'];
      const fetchSuggestionsStub = sinon.stub().returns({ then: (callback) => callback(results) });
      const onUpdateStub = sinon.stub();
      const element = renderComponent(TextFilter, getProps({
        filter,
        onUpdate: onUpdateStub,
        fetchSuggestions: fetchSuggestionsStub
      }));

      const picklistOption = element.querySelector('.picklist-option');
      Simulate.click(picklistOption);

      const button = element.querySelector('.apply-btn');
      Simulate.click(button);

      expect(onUpdateStub).to.have.been.calledWith({
        parameters: {
          'function': 'binaryOperator',
          columnName: 'some_word',
          arguments: {
            operator: '=',
            operand: 'penguin'
          }
        }
      });
    });
  });
});
