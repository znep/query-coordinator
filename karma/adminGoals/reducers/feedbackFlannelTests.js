import Immutable from 'immutable';
import { combineReducers } from 'redux-immutablejs';
import {
  OPEN_FEEDBACK_FLANNEL,
  CLOSE_FEEDBACK_FLANNEL
} from 'actionTypes';
import feedbackFlannel from 'reducers/feedbackFlannel';

describe('feedbackFlannel reducers', () => {
  const testReducer = combineReducers({ feedbackFlannel });

  it(`should handle ${OPEN_FEEDBACK_FLANNEL}`, () => {
    const defaultState = Immutable.Map({
      feedbackFlannel: { visible: false }
    });

    const reducerReturn = testReducer(defaultState, {
      type: OPEN_FEEDBACK_FLANNEL,
      hoverable: 'target'
    });

    const expectedReturn = {
      feedbackFlannel: {
        visible: true,
        hoverable: 'target'
      }
    };

    expect(reducerReturn.toJS()).to.deep.eq(expectedReturn);
  });

  it(`should handle ${CLOSE_FEEDBACK_FLANNEL}`, () => {
    const defaultState = Immutable.Map({
      feedbackFlannel: { visible: true }
    });

    const reducerReturn = testReducer(defaultState, {
      type: CLOSE_FEEDBACK_FLANNEL
    });

    const expectedReturn = {
      feedbackFlannel: { visible: false, hoverable: null }
    };

    expect(reducerReturn.toJS()).to.deep.eq(expectedReturn);
  });
});
