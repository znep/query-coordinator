import _ from 'lodash';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import immutable from 'immutable';
import { expect, assert } from 'chai';

import serviceLocator from 'middlewares/serviceLocator';

import {
  SET_ACTIVITIES,
  SET_PAGINATION,
  DISMISS_RESTORE_MODAL
} from 'actionTypes';
import {
  loadActivities,
  restoreDataset
} from 'actions';
import reducer from 'reducer';

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
  pagination: null
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

      expect(dispatchedActions[0].type).to.eq(SET_ACTIVITIES);
      expect(dispatchedActions[1].type).to.eq(SET_PAGINATION);
    });
  });

  xit('should be able to load next page', () => {

  });

  xit('should be able to load previous page', () => {

  });

  it('should be able to restore dataset', () => {
    mockHttpClient.respondWith('PATCH', /\/views\/xxxx\-xxxx\.json/, 200, {});
    mockHttpClient.respondWith('GET', /\/admin\/activity_feed\.json/, 200, mockActivities);

    store = mockStore(_.merge(initialState, immutable.fromJS({restoreModal: {id: 'xxxx-xxxx'}})));

    const action = restoreDataset({});

    return store.dispatch(action).then(() => {
      const dispatchedActions = store.getActions();

      expect(dispatchedActions[0].type).to.eq(DISMISS_RESTORE_MODAL);
      expect(dispatchedActions[1].type).to.eq(SET_ACTIVITIES);
      expect(dispatchedActions[2].type).to.eq(SET_PAGINATION);
    });
  });
});
