import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import immutable from 'immutable';
import { assert } from 'chai';

import serviceLocator from 'middlewares/serviceLocator';

import {
  SET_ACTIVITIES,
  SET_PAGINATION,
  DISMISS_RESTORE_MODAL
} from 'actionTypes';
import {
  loadActivities,
  restoreDataset,
  gotoPage
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

  it('should be able to load activities', () => {
    mockHttpClient.respondWith('GET', /\/admin\/activity_feed\.json/, 200, mockActivities);

    return store.dispatch(loadActivities()).then(() => {
      const dispatchedActions = store.getActions();

      assert(dispatchedActions[0].type === SET_ACTIVITIES);
      assert(dispatchedActions[1].type === SET_PAGINATION);
    });
  });

  it('should be able to goto page', () => {
    mockHttpClient.respondWith('GET', /\/admin\/activity_feed\.json/, 200, mockActivities);

    return store.dispatch(gotoPage(2)).then(() => {
      const dispatchedActions = store.getActions();
      const actionTypes = dispatchedActions.map(a => a.type);

      const expectedTypes = [
        SET_PAGINATION,
        SET_ACTIVITIES,
        SET_PAGINATION
      ];

      assert(actionTypes[0] === expectedTypes[0]);
      assert(actionTypes[1] === expectedTypes[1]);
      assert(actionTypes[2] === expectedTypes[2]);
    });
  });

  it('should be able to restore dataset', () => {
    mockHttpClient.respondWith('PATCH', /\/views\/xxxx\-xxxx\.json/, 200, {});
    mockHttpClient.respondWith('GET', /\/admin\/activity_feed\.json/, 200, mockActivities);

    store = mockStore(_.merge(initialState, immutable.fromJS({restoreModal: {id: 'xxxx-xxxx'}})));

    const action = restoreDataset({});

    return store.dispatch(action).then(() => {
      const dispatchedActions = store.getActions();

      assert(dispatchedActions[0].type === DISMISS_RESTORE_MODAL);
      assert(dispatchedActions[1].type === SET_ACTIVITIES);
      assert(dispatchedActions[2].type === SET_PAGINATION);
    });
  });
});
