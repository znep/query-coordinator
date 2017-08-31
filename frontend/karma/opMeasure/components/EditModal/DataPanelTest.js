import { assert } from 'chai';
import sinon from 'sinon';
import { Simulate } from 'react-addons-test-utils';

import { DataSourceStates } from 'lib/constants';
import { DataPanel } from 'components/EditModal/DataPanel';

describe('DataPanel', () => {
  const getProps = (props) => {
    return {
      dataSource: {},
      ...props
    };
  };

  it('renders', () => {
    const element = renderComponent(DataPanel, getProps());
    assert.ok(element);
  });

  it('shows a success indicator when the dataSource field points to a valid view with data', () => {
    const element = renderComponent(DataPanel, getProps({
      status: DataSourceStates.VALID
    }));
    assert.ok(element.querySelector('.data-source-indicator.icon-check-2'));
    assert.notOk(element.querySelector('.data-source-indicator.icon-warning'));
    assert.notOk(element.querySelector('.data-source-indicator.icon-cross2'));
  });

  it('shows a warning indicator when the dataSource field points to a valid view with no rows', () => {
    const element = renderComponent(DataPanel, getProps({
      status: DataSourceStates.NO_ROWS
    }));
    assert.notOk(element.querySelector('.data-source-indicator.icon-check-2'));
    assert.ok(element.querySelector('.data-source-indicator.icon-warning'));
    assert.notOk(element.querySelector('.data-source-indicator.icon-cross2'));
  });

  it('shows an error indicator when the dataSource field points to an invalid view', () => {
    const element = renderComponent(DataPanel, getProps({
      status: DataSourceStates.INVALID
    }));
    assert.notOk(element.querySelector('.data-source-indicator.icon-check-2'));
    assert.notOk(element.querySelector('.data-source-indicator.icon-warning'));
    assert.ok(element.querySelector('.data-source-indicator.icon-cross2'));
  });

  it('shows no status indicator when the dataSource field is empty', () => {
    const element = renderComponent(DataPanel, getProps());
    assert.notOk(element.querySelector('.data-source-indicator.icon-check-2'));
    assert.notOk(element.querySelector('.data-source-indicator.icon-warning'));
    assert.notOk(element.querySelector('.data-source-indicator.icon-cross2'));
  });

  it('updates the dataSource state value when the dataSource field value is changed', () => {
    const spy = sinon.spy();
    const element = renderComponent(DataPanel, getProps({
      onChangeDataSource: spy
    }));

    sinon.assert.notCalled(spy);
    Simulate.change(element.querySelector('#data-source'), 'test-test');
    sinon.assert.calledOnce(spy);
  });
});
