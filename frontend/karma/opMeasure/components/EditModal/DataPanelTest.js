import _ from 'lodash';
import { assert } from 'chai';
import sinon from 'sinon';
import { Simulate } from 'react-dom/test-utils';

import { DataPanel, DataSourceStates, mapStateToProps } from 'components/EditModal/DataPanel';

describe('DataPanel', () => {
  describe('DataPanel mapStateToProps', () => {
    it('passes through uid', () => {
      const state = _.set({}, 'editor.measure.metric.dataSource.uid', 'test-test');
      assert.propertyVal(
        mapStateToProps(state),
        'uid',
        'test-test'
      );
    });
    describe('dataSourceState', () => {
      it('is set to INVALID if rowCount is not set in state', () => {
        assert.propertyVal(
          mapStateToProps({}),
          'dataSourceState',
          DataSourceStates.INVALID
        );
      });

      it('is set to INVALID if rowCount is negative', () => {
        const state = _.set({}, 'editor.cachedRowCount', -1);
        assert.propertyVal(
          mapStateToProps(state),
          'dataSourceState',
          DataSourceStates.INVALID
        );
      });

      it('is set to INVALID if rowCount is NaN', () => {
        const state = _.set({}, 'editor.cachedRowCount', NaN);
        assert.propertyVal(
          mapStateToProps(state),
          'dataSourceState',
          DataSourceStates.INVALID
        );
      });

      it('is set to NO_ROWS if rowCount is 0', () => {
        const state = _.set({}, 'editor.cachedRowCount', 0);
        assert.propertyVal(
          mapStateToProps(state),
          'dataSourceState',
          DataSourceStates.NO_ROWS
        );
      });

      it('is set to VALID if rowCount is > 0', () => {
        const state = _.set({}, 'editor.cachedRowCount', 10);
        assert.propertyVal(
          mapStateToProps(state),
          'dataSourceState',
          DataSourceStates.VALID
        );
      });
    });
  });

  describe('DataPanel component', () => {
    const getProps = (props) => {
      return {
        ...props
      };
    };

    it('renders', () => {
      const element = renderComponent(DataPanel, getProps());
      assert.ok(element);
    });

    it('shows a success indicator when the dataSource field points to a valid view with data', () => {
      const element = renderComponent(DataPanel, getProps({
        dataSourceState: DataSourceStates.VALID
      }));
      assert.ok(element.querySelector('.data-source-indicator.icon-check-2'));
      assert.notOk(element.querySelector('.data-source-indicator.icon-warning'));
      assert.notOk(element.querySelector('.data-source-indicator.icon-cross2'));
    });

    it('shows a warning indicator when the dataSource field points to a valid view with no rows', () => {
      const element = renderComponent(DataPanel, getProps({
        dataSourceState: DataSourceStates.NO_ROWS
      }));
      assert.notOk(element.querySelector('.data-source-indicator.icon-check-2'));
      assert.ok(element.querySelector('.data-source-indicator.icon-warning'));
      assert.notOk(element.querySelector('.data-source-indicator.icon-cross2'));
    });

    it('shows an error indicator when the dataSource field points to an invalid view', () => {
      const element = renderComponent(DataPanel, getProps({
        dataSourceState: DataSourceStates.INVALID
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
});
