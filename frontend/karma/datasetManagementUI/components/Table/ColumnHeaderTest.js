import sinon from 'sinon';
import { expect, assert } from 'chai';
import _ from 'lodash';
import ColumnHeader from 'components/Table/ColumnHeader';
import { getEmptyStore } from '../../testStore';
import { apiCallStarted, COLUMN_OPERATIONS } from 'actions/apiCalls';

describe('components/Table/ColumnHeader', () => {

  const defaultProps = {
    outputSchema: {
      id: 52
    },
    column: {
      transform: {
        output_soql_type: 'SoQLText'
      },
      display_name: 'foo'
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
    select.value = 'SoQLNumber';
    TestUtils.Simulate.change(select);
    expect(spy.args[0]).to.deep.equal([
      defaultProps.outputSchema,
      defaultProps.column,
      'SoQLNumber'
    ])
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
      column: {
        transform: {
          output_soql_type: 'SoQLText'
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
    select.value = 'SoQLNumber';
    TestUtils.Simulate.change(select);
    expect(spy.args[0]).to.deep.equal([
      newProps.outputSchema,
      defaultProps.column,
      'SoQLNumber'
    ]);
  });

  it('renders correct list of types', () => {
    const element = document.createElement('tr');
    ReactDOM.render(<ColumnHeader {...defaultProps} />, element);

    const options = element.querySelectorAll('select option');
    const values = [...options].map(option => option.value)
    expect(values).to.deep.equal([
      'SoQLFloatingTimestamp',
      'SoQLNumber',
      'SoQLText',
      'SoQLBoolean',
      'SoQLLocation'
    ]);
  });

  it('renders a spinner and disables if an output schema is being created that replaces this column', () => {
    COLUMN_OPERATIONS.forEach((operation) => {
      const store = getEmptyStore();
      const call = {
        operation: operation,
        params: {
          outputColumnId: 5
        }
      };
      store.dispatch(apiCallStarted(0, call));
      const props = {
        ...defaultProps,
        column: {
          id: 5,
          transform: {
            output_soql_type: 'SoQLText'
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
    const call = {
      operation: 'VALIDATE_ROW_IDENTIFIER',
      params: {
        outputColumnId: 5
      }
    };
    const props = {
      ...defaultProps,
      column: {
        id: 5,
        transform: {
          output_soql_type: 'SoQLText'
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

  it('doesn\'t render a spinner if there\'s no api call in progress', () => {
    const props = {
      ...defaultProps,
      column: {
        id: 5,
        transform: {
          output_soql_type: 'SoQLText'
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
    const store = getEmptyStore();
    const props = {
      ...defaultProps,
      column: {
        transform: {
          output_soql_type: 'SoQLText'
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
