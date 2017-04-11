import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import immutable from 'immutable';
import { expect, assert } from 'chai';

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
    expect(newState.get('activities').count()).to.eq(3);
  });

  it('should be able to set pagination', () => {
    const pagination = {page: 4};
    const newState = reducer(initialState, actions.setPagination(pagination));

    expect(newState.get('pagination').toJS()).to.deep.equal(pagination);
  });
});
