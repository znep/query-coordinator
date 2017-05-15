import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import immutable from 'immutable';
import { assert } from 'chai';

import serviceLocator from 'middlewares/serviceLocator';

import {
  START_LOADING,
  STOP_LOADING,
  SET_ACTIVITIES,
  SET_PAGINATION,
  DISMISS_RESTORE_MODAL,
  SET_ALERT,
  SET_FILTER_EVENT,
  SET_FILTER_STATUS,
  SET_FILTER_DATE
} from 'actionTypes';
import {
  loadActivities,
  restoreDataset,
  gotoPage,
  filterByEvent,
  filterByStatus,
  filterByDate
} from 'actions';

import mockActivities from './mockActivities';

import MockHttpClient from './MockHttpClient';
import ActivityFeedApi from 'frontendApi/ActivityFeedApi';

const mockHttpClient = new MockHttpClient();
const api = new ActivityFeedApi(mockHttpClient);

const initialState = immutable.fromJS({
  activities: [],
  loadingFeed: false,
  filtering: {
    eventType: 'All',
    eventStatus: 'All',
    dateFrom: null,
    dateTo: null
  },
  pagination: {
    currentPage: 1,
    hasNextPage: true,
    hasPreviousPage: false
  }
});

const mockStore = configureStore([
  serviceLocator({ api }),
  thunk
]);

describe('Activity Feed actions', () => {
  let store;

  beforeEach(() => {
    mockHttpClient.reset();
    store = mockStore(initialState);
  });

  const assertActionList = (dispatchedActions, expectedActions) => {
    const dispatchedActionsArray = dispatchedActions.map(a => a.type);

    assert(dispatchedActionsArray.length, expectedActions.length);

    for (let i = 0; i < dispatchedActionsArray.length; i++) {
      assert.equal(dispatchedActionsArray[i], expectedActions[i]);
    }
  };

  it('should be able to load activities', () => {
    mockHttpClient.respondWith('GET', /\/admin\/activity_feed\.json/, 200, mockActivities);

    return store.dispatch(loadActivities()).then(() => {
      const dispatchedActions = store.getActions();
      const expectedActions = [
        START_LOADING,
        SET_ACTIVITIES,
        SET_PAGINATION,
        STOP_LOADING
      ];

      assertActionList(dispatchedActions, expectedActions);
    });
  });

  it('should be able to goto page', () => {
    mockHttpClient.respondWith('GET', /\/admin\/activity_feed\.json/, 200, mockActivities);

    return store.dispatch(gotoPage(2)).then(() => {
      const dispatchedActions = store.getActions();

      const expectedActions = [
        SET_PAGINATION,
        START_LOADING,
        SET_ACTIVITIES,
        SET_PAGINATION,
        STOP_LOADING
      ];

      assertActionList(dispatchedActions, expectedActions)
    });
  });

  it('should be able to restore dataset', () => {
    mockHttpClient.respondWith('PATCH', /\/views\/xxxx\-xxxx\.json/, 200, {});
    mockHttpClient.respondWith('GET', /\/admin\/activity_feed\.json/, 200, mockActivities);

    store = mockStore(initialState.merge(immutable.fromJS({restoreModal: {id: 'xxxx-xxxx'}})));

    const action = restoreDataset({});

    return store.dispatch(action).then(() => {
      const dispatchedActions = store.getActions();
      const expectedActions = [
        START_LOADING,
        SET_ALERT,
        DISMISS_RESTORE_MODAL,
        START_LOADING,
        SET_ACTIVITIES,
        SET_PAGINATION,
        STOP_LOADING
      ];

      assertActionList(dispatchedActions, expectedActions);
    });
  });

  it('should be able to filter by event type', () => {
    mockHttpClient.respondWith('GET', /\/admin\/activity_feed\.json/, 200, mockActivities);

    const action = filterByEvent('a_value');

    return store.dispatch(action).then(() => {
      const dispatchedActions = store.getActions();
      const expectedActions = [
        SET_PAGINATION,
        SET_FILTER_EVENT,
        START_LOADING,
        SET_ACTIVITIES,
        SET_PAGINATION,
        STOP_LOADING
      ];

      assertActionList(dispatchedActions, expectedActions)
    });
  });

  it('should be able to filter by status', () => {
    mockHttpClient.respondWith('GET', /\/admin\/activity_feed\.json/, 200, mockActivities);

    const action = filterByStatus('a_value');

    return store.dispatch(action).then(() => {
      const dispatchedActions = store.getActions();
      const expectedActions = [
        SET_PAGINATION,
        SET_FILTER_STATUS,
        START_LOADING,
        SET_ACTIVITIES,
        SET_PAGINATION,
        STOP_LOADING
      ];

      assertActionList(dispatchedActions, expectedActions)
    });
  });

  it('should be able to filter by date range', () => {
    mockHttpClient.respondWith('GET', /\/admin\/activity_feed\.json/, 200, mockActivities);

    const action = filterByDate({from: 'a_date', to: 'future_date'});

    return store.dispatch(action).then(() => {
      const dispatchedActions = store.getActions();
      const expectedActions = [
        SET_PAGINATION,
        SET_FILTER_DATE,
        START_LOADING,
        SET_ACTIVITIES,
        SET_PAGINATION,
        STOP_LOADING
      ];

      assertActionList(dispatchedActions, expectedActions);
    });
  });
});
