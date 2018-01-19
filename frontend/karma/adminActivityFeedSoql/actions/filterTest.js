import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { assert } from 'chai';
import sinon from 'sinon';
import { mockResponse } from 'httpHelpers';
import * as filterActions from 'adminActivityFeedSoql/actions/filters';

describe('filter actions', () => {
  const responseData = [{'COLUMN_ALIAS_GUARD__count':'3'}];
  let fetchRowCountStub;

  beforeEach(() => {
    const response = _.constant(Promise.resolve(mockResponse(responseData, 200)));

    fetchRowCountStub = sinon.
      stub(window, 'fetch').
      callsFake(response);
  });

  afterEach(() => {
    fetchRowCountStub.restore();
  });

  it('.changeTab', (done) => {
    const initialState = {
      filters: {
        activeTab: 'all'
      },
      pagination: {
        pageSize: 10,
        page: 1,
        rowCount: 10
      }
    };

    const mockStore = configureStore([thunk]);
    const store = mockStore(initialState);

    store.
      dispatch(filterActions.changeTab('failure')).
      then(() => {
        const dispatchedAction = store.getActions().
          find(act => act.type === filterActions.types.CHANGE_TAB);

        assert.isOk(dispatchedAction.tab === 'failure');
        done();
      });
  });

  it('.changeAssetType', (done) => {
    const initialState = {
      filters: {
        activeTab: 'all'
      },
      pagination: {
        pageSize: 10,
        page: 1,
        rowCount: 10
      }
    };

    const mockStore = configureStore([thunk]);
    const store = mockStore(initialState);

    store.
      dispatch(filterActions.changeAssetType('dataset')).
      then(() => {
        const dispatchedAction = store.getActions().
          find(act => act.type === filterActions.types.CHANGE_ASSET_TYPE);

        assert.isOk(dispatchedAction.assetType === 'dataset');
        done();
      });
  });

  it('.changeEventFilter', (done) => {
    const initialState = {
      filters: {
        activeTab: 'all'
      },
      pagination: {
        pageSize: 10,
        page: 1,
        rowCount: 10
      }
    };

    const mockStore = configureStore([thunk]);
    const store = mockStore(initialState);

    store.
      dispatch(filterActions.changeEventFilter('an event')).
      then(() => {
        const dispatchedAction = store.getActions().
          find(act => act.type === filterActions.types.CHANGE_EVENT);

        assert.isOk(dispatchedAction.event === 'an event');
        done();
      });
  });

  it('.changeDateRange', (done) => {
    const initialState = {
      filters: {
        activeTab: 'all'
      },
      pagination: {
        pageSize: 10,
        page: 1,
        rowCount: 10
      }
    };

    const mockStore = configureStore([thunk]);
    const store = mockStore(initialState);
    const date = {
      start: '2017-01-01T00:00:00',
      end: '2017-02-01T00:00:00'
    };

    store.
      dispatch(filterActions.changeDateRange(date)).
      then(() => {
        const dispatchedAction = store.getActions().
          find(act => act.type === filterActions.types.CHANGE_DATE_RANGE);

        assert.deepEqual(dispatchedAction.date, date);
        done();
      });
  });

});
