import _ from 'lodash';
import ColumnHeader from 'components/Table/ColumnHeader';
import ReactDOM from 'react-dom';

describe('components/Table/ColumnHeader', () => {

  const defaultProps = {
    outputSchema: {
      id: 52
    },
    column: {
      soql_type: 'bar',
      name: 'foo'
    },
    updateColumnType: _.noop
  };

  it('renders without errors', () => {
    const container = document.createElement('tr');
    const element = ReactDOM.render(<ColumnHeader {...defaultProps} />, container);
    expect(element).to.not.be.null;
  });

  it('handles column type changing', () => {
    const spy = sinon.spy();
    const props = {
      ...defaultProps,
      updateColumnType: spy
    };
    const container = document.createElement('tr');
    ReactDOM.render(<ColumnHeader {...props} />, container);
    const select = container.querySelector('select');
    select.value = 'SoQLNumber';
    TestUtils.Simulate.change(select);
    expect(spy.args[0]).to.deep.equal([
      defaultProps.outputSchema,
      defaultProps.column,
      'SoQLNumber'
    ])
  });

  // testing fix for EN-12896
  it('handles column type changing after output schema changes', () => {
    const spy = sinon.spy();
    const propsWithSpy = {
      ...defaultProps,
      updateColumnType: spy
    };
    const container = document.createElement('tr');
    // render for the first time
    ReactDOM.render(<ColumnHeader {...propsWithSpy} />, container);
    // render for the second time, with new output schema
    const newProps = {
      ...propsWithSpy,
      outputSchema: {
        id: 53
      }
    };
    ReactDOM.render(<ColumnHeader {...newProps} />, container);
    const select = container.querySelector('select');
    select.value = 'SoQLNumber';
    TestUtils.Simulate.change(select);
    expect(spy.args[0]).to.deep.equal([
      newProps.outputSchema,
      defaultProps.column,
      'SoQLNumber'
    ])
  });

});
