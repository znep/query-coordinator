import immutable from 'immutable';
import { assert } from 'chai';

import * as actions from 'actions';
import reducer from 'reducer';

import mockActivities from './mockActivities';

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

describe('Activity Feed reducer', () => {
  it('should be able to set activities', () => {
    const newState = reducer(initialState, actions.setActivities(mockActivities.activities));
    assert(newState.get('activities').count() === 3);
  });

  it('should be able to set pagination', () => {
    const pagination = {page: 4};
    const newState = reducer(initialState, actions.setPagination(pagination));

    assert.deepEqual(newState.get('pagination').toJS(), pagination);
  });
});
