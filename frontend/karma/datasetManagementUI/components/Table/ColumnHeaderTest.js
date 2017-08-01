import sinon from 'sinon';
import { expect, assert } from 'chai';
import _ from 'lodash';
import TestUtils from 'react-addons-test-utils';
import React from 'react';
import ReactDOM from 'react-dom';
import ColumnHeader from 'components/Table/ColumnHeader';
import { apiCallStarted, COLUMN_OPERATIONS } from 'actions/apiCalls';
import { createStore, applyMiddleware } from 'redux';
import reducer from 'reducers/rootReducer';
import thunk from 'redux-thunk';
import { bootstrapApp } from 'actions/bootstrap';
import mockSocket from '../../testHelpers/mockSocket';
import dotProp from 'dot-prop-immutable';
import { bootstrapChannels } from '../../data/socketChannels';

const socket = mockSocket(bootstrapChannels);

describe('components/Table/ColumnHeader', () => {
  const defaultProps = {
    outputSchema: {
      id: 52
    },
    outputColumn: {
      display_name: 'foo',
      transform: {
        output_soql_type: 'text'
      },
      inputColumn: {
        soql_type: 'text'
      }
    },
    activeApiCallInvolvingThis: false,
    updateColumnType: _.noop,
    addColumn: _.noop,
    dropColumn: _.noop,
    validateThenSetRowIdentifier: _.noop
  };

  it('renders without errors', () => {
    const element = document.createElement('tr');
    ReactDOM.render(<ColumnHeader {...defaultProps} />, element);
    assert.ok(element);
  });

  it('handles column type changing', () => {
    const spy = sinon.spy();
    const props = {
      ...defaultProps,
      updateColumnType: spy,
      addColumn: _.noop,
      dropColumn: _.noop
    };
    const element = document.createElement('tr');
    ReactDOM.render(<ColumnHeader {...props} />, element);

    const select = element.querySelector('select');
    select.value = 'number';
    TestUtils.Simulate.change(select);
    expect(spy.args[0]).to.deep.equal([
      defaultProps.outputSchema,
      defaultProps.outputColumn,
      'number'
    ]);
  });

  it('renders a disable button when not disabled', () => {
    const props = {
      ...defaultProps,
      updateColumnType: _.noop,
      addColumn: _.noop,
      dropColumn: _.noop
    };
    const element = document.createElement('tr');
    ReactDOM.render(<ColumnHeader {...props} />, element);

    TestUtils.Simulate.click(element.querySelector('.dropdownButton'));
    expect(element.querySelector('.socrata-icon-eye-blocked')).to.exist;
    expect(element.querySelector('.socrata-icon-add')).to.not.exist;
  });

  it('renders an add button when disabled', () => {
    const props = {
      ...defaultProps,
      outputColumn: {
        transform: {
          output_soql_type: 'text'
        },
        inputColumn: {
          soql_type: 'text'
        },
        ignored: true
      },
      updateColumnType: _.noop,
      addColumn: _.noop,
      dropColumn: _.noop
    };
    const element = document.createElement('tr');
    ReactDOM.render(<ColumnHeader {...props} />, element);

    TestUtils.Simulate.click(element.querySelector('.dropdownButton'));
    expect(element.querySelector('.socrata-icon-eye-blocked')).to.not.exist;
    expect(element.querySelector('.socrata-icon-plus3')).to.exist;
  });

  // testing fix for EN-12896
  it('handles column type changing after output schema changes', () => {
    const spy = sinon.spy();
    const propsWithSpy = {
      ...defaultProps,
      updateColumnType: spy
    };
    // render for the first time
    const element = document.createElement('tr');
    ReactDOM.render(<ColumnHeader {...propsWithSpy} />, element);
    // render for the second time, with new output schema
    const newProps = {
      ...propsWithSpy,
      outputSchema: {
        id: 53
      }
    };
    ReactDOM.render(<ColumnHeader {...newProps} />, element);
    const select = element.querySelector('select');
    select.value = 'number';
    TestUtils.Simulate.change(select);
    expect(spy.args[0]).to.deep.equal([
      newProps.outputSchema,
      defaultProps.outputColumn,
      'number'
    ]);
  });

  describe('type list', () => {
    it('renders correct list of types for a text input column', () => {
      const element = document.createElement('tr');
      ReactDOM.render(<ColumnHeader {...defaultProps} />, element);

      const options = element.querySelectorAll('select option');
      const values = [...options].map(option => option.value);
      expect(values).to.deep.equal([
        'calendar_date',
        'number',
        'text',
        'checkbox'
      ]);
    });

    it('renders correct list of types for a geo input column', () => {
      const element = document.createElement('tr');
      const withGeoInput = dotProp.set(
        defaultProps,
        'outputColumn.inputColumn.soql_type',
        'multipolygon'
      );
      ReactDOM.render(<ColumnHeader {...withGeoInput} />, element);

      const options = element.querySelectorAll('select option');
      const values = [...options].map(option => option.value);
      expect(values).to.deep.equal(['multipolygon', 'text']);
    });

    it('renders correct list of types for a number column', () => {
      const element = document.createElement('tr');
      const withNumInput = dotProp.set(
        defaultProps,
        'outputColumn.inputColumn.soql_type',
        'number'
      );
      ReactDOM.render(<ColumnHeader {...withNumInput} />, element);

      const options = element.querySelectorAll('select option');
      const values = [...options].map(option => option.value);
      expect(values).to.deep.equal(['number', 'text', 'checkbox']);
    });
  });

  it('renders a spinner and disables if an output schema is being created that replaces this column', () => {
    COLUMN_OPERATIONS.forEach(operation => {
      const store = createStore(
        reducer,
        applyMiddleware(thunk.withExtraArgument(socket))
      );
      store.dispatch(
        bootstrapApp(
          window.initialState.view,
          window.initialState.revision,
          window.initialState.customMetadataFieldsets
        )
      );
      const call = {
        operation: operation,
        params: {
          outputColumnId: 5
        }
      };
      store.dispatch(apiCallStarted(0, call));
      const props = {
        ...defaultProps,
        outputColumn: {
          inputColumn: {
            soql_type: 'text'
          },
          id: 5,
          transform: {
            output_soql_type: 'text'
          }
        },
        activeApiCallInvolvingThis: true,
        updateColumnType: _.noop,
        addColumn: _.noop,
        dropColumn: _.noop
      };
      const element = document.createElement('tr');
      ReactDOM.render(<ColumnHeader {...props} />, element);

      expect(element.querySelector('.spinner-default')).to.exist;
    });
  });

  it('renders a spinner and disables if this column is being validated as a row identifier', () => {
    const props = {
      ...defaultProps,
      outputColumn: {
        inputColumn: {
          soql_type: 'text'
        },
        id: 5,
        transform: {
          output_soql_type: 'text'
        }
      },
      activeApiCallInvolvingThis: true,
      updateColumnType: _.noop,
      addColumn: _.noop,
      dropColumn: _.noop
    };
    const element = document.createElement('tr');
    ReactDOM.render(<ColumnHeader {...props} />, element);

    expect(element.querySelector('.spinner-default')).to.exist;
  });

  it("doesn't render a spinner if there's no api call in progress", () => {
    const props = {
      ...defaultProps,
      outputColumn: {
        inputColumn: {
          soql_type: 'text'
        },
        id: 5,
        transform: {
          output_soql_type: 'text'
        }
      },
      updateColumnType: _.noop,
      addColumn: _.noop,
      dropColumn: _.noop
    };
    const element = document.createElement('tr');
    ReactDOM.render(<ColumnHeader {...props} />, element);

    expect(element.querySelector('.spinner-default')).to.not.exist;
  });

  it('renders an id icon if this is a row identifier', () => {
    const props = {
      ...defaultProps,
      outputColumn: {
        inputColumn: {
          soql_type: 'text'
        },
        transform: {
          output_soql_type: 'text'
        },
        is_primary_key: true
      },
      updateColumnType: _.noop,
      addColumn: _.noop,
      dropColumn: _.noop
    };
    const element = document.createElement('tr');
    ReactDOM.render(<ColumnHeader {...props} />, element);
    expect(element.querySelector('.socrata-icon-id')).to.exist;
  });
});
