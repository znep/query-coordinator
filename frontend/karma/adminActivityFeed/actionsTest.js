import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import immutable from 'immutable';
import { expect, assert } from 'chai';

import serviceLocator from 'middlewares/serviceLocator';

import * as actions from 'actions';
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

    return store.dispatch(actions.loadActivities()).then(() => {
      const dispatchedActions = store.getActions();

      expect(dispatchedActions[0].type).to.eq(actions.types.setActivities);
      expect(dispatchedActions[1].type).to.eq(actions.types.setPagination);
    });
  });

  xit('should be able to load next page', () => {

  });

  xit('should be able to load previous page', () => {

  });
});
