import { assert } from 'chai';
import React from 'react';
import RecentActions from 'components/RecentActions';
import state from '../data/stateWithRevision';
import rootReducer from 'reducers/rootReducer';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';

describe('components/RecentActions', () => {
  const store = createStore(rootReducer, state, applyMiddleware(thunk));

  const component = renderComponentWithStore(RecentActions, {}, store);

  it('renders all activity', () => {
    assert.equal(component.querySelectorAll('.activity').length, 5);
  });

  it('renders data processing activity', () => {
    const activities = [...component.querySelectorAll('.activity')];

    assert.isAtLeast(
      activities.filter(
        activity => activity.getAttribute('data-activity-type') === 'taskSet'
      ).length,
      1
    );
  });

  it('renders schema change activity', () => {
    const activities = [...component.querySelectorAll('.activity')];

    assert.isAtLeast(
      activities.filter(
        activity =>
          activity.getAttribute('data-activity-type') === 'outputschema'
      ).length,
      1
    );
  });

  it('renders file source activity', () => {
    const activities = [...component.querySelectorAll('.activity')];

    assert.isAtLeast(
      activities.filter(
        activity => activity.getAttribute('data-activity-type') === 'source'
      ).length,
      1
    );
  });

  it('renders revision activity', () => {
    const activities = [...component.querySelectorAll('.activity')];

    assert.isAtLeast(
      activities.filter(
        activity => activity.getAttribute('data-activity-type') === 'update'
      ).length,
      1
    );
  });
});
