import immutable from 'immutable';
import { assert } from 'chai';

import * as actions from 'adminActivityFeed/actions';
import * as actionTypes from 'adminActivityFeed/actionTypes';
import reducer from 'adminActivityFeed/reducer';

import mockActivities from './mockActivities';

const initialState = immutable.fromJS({
  activities: [],
  loadingFeed: false,
  filter: {
    event: 'All',
    status: 'All',
    dateFrom: null,
    dateTo: null
  },
  pagination: null
});

describe('Activity Feed reducer', () => {
  it('should be able to set activities', () => {
    const newState = reducer(initialState, actions.setActivities(mockActivities.activities));
    assert.equal(newState.get('activities').count(), 5);
  });

  it('should be able to set pagination', () => {
    const pagination = {page: 4};
    const newState = reducer(initialState, actions.setPagination(pagination));

    assert.deepEqual(newState.get('pagination').toJS(), pagination);
  });

  it('should be able to set filtering by event type', () => {
    const testValue = {event: 'Delete'};
    const newState = reducer(initialState, {type: actionTypes.SET_FILTER, filter: testValue});

    assert.deepEqual(
      newState.get('filter').toJS(),
      initialState.get('filter').mergeDeep(immutable.fromJS(testValue)).toJS()
    );
  });
});
