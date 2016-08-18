import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Immutable from 'immutable';

import {
  openFeedbackFlannel,
  closeFeedbackFlannel
} from 'actions/feedbackFlannelActions';

import {
  OPEN_FEEDBACK_FLANNEL,
  CLOSE_FEEDBACK_FLANNEL
} from 'actionTypes';

const mockStore = configureStore([thunk]);
const initialState = Immutable.fromJS({
  feedbackFlannel: { visible: false }
});

describe('actions/feedbackFlannelActions', () => {
  let store;

  beforeEach(() => {
    store = mockStore(initialState);
  });

  it('should dispatch open feedback flannel action with hoverable', () => {
    const returnValue = openFeedbackFlannel('target');
    expect(returnValue).to.deep.eq({type: OPEN_FEEDBACK_FLANNEL, hoverable: 'target'});
  });

  it('should dispatch close feedback flannel', () => {
    const returnValue = closeFeedbackFlannel();
    expect(returnValue).to.deep.eq({type: CLOSE_FEEDBACK_FLANNEL});
  });
});