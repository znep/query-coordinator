import { assert } from 'chai';
import React from 'react';
import RecentActions from 'components/RecentActions/RecentActions';
import state from '../data/stateWithRevision';
import rootReducer from 'reduxStuff/reducers/rootReducer';
import { applyMiddleware, createStore } from 'redux';
import thunk from 'redux-thunk';
import { shallow } from 'enzyme';

describe('components/RecentActions', () => {
  const store = createStore(rootReducer, state, applyMiddleware(thunk));

  const params = {
    category: 'dataset',
    name: 'mm',
    fourfour: 'kp42-jdvd',
    revisionSeq: '0'
  };

  const { entities } = store.getState();

  const props = {
    entities,
    params
  };

  const component = shallow(<RecentActions {...props} />);

  it('renders all activity', () => {
    assert.equal(component.find('.activity').length, 5);
  });

  it('renders data processing activity', () => {
    const activities = component.find('.activity');

    assert.isAtLeast(
      activities.filterWhere(
        activity => activity.prop('data-activity-type') === 'taskSet'
      ).length,
      1
    );
  });

  it('renders schema change activity', () => {
    const activities = component.find('.activity');

    assert.isAtLeast(
      activities.filterWhere(
        activity => activity.prop('data-activity-type') === 'outputschema'
      ).length,
      1
    );
  });

  it('renders file source activity', () => {
    const activities = component.find('.activity');

    assert.isAtLeast(
      activities.filterWhere(
        activity => activity.prop('data-activity-type') === 'source'
      ).length,
      1
    );
  });

  it('renders revision activity', () => {
    const activities = component.find('.activity');

    assert.isAtLeast(
      activities.filterWhere(
        activity => activity.prop('data-activity-type') === 'update'
      ).length,
      1
    );
  });
});
