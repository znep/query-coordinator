import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import Immutable from 'immutable';
import { combineReducers } from 'redux-immutablejs';

import * as Actions from 'components/feedback/flannel/actions';
import reducer from 'components/feedback/flannel/reducer'

describe('components/feedback/flannel reducers', () => {
  const testReducer = combineReducers({ feedback: reducer });

  it(`should handle ${Actions.types.open}`, () => {
    const defaultState = Immutable.Map({
      feedback: { visible: false }
    });

    const reducerReturn = testReducer(defaultState, {
      type: Actions.types.open,
      hoverable: 'target'
    });

    const expectedReturn = {
      feedback: {
        visible: true,
        hoverable: 'target'
      }
    };

    expect(reducerReturn.toJS()).to.deep.eq(expectedReturn);
  });

  it(`should handle ${Actions.types.close}`, () => {
    const defaultState = Immutable.Map({
      feedback: { visible: true }
    });

    const reducerReturn = testReducer(defaultState, {
      type: Actions.types.close
    });

    const expectedReturn = {
      feedback: { visible: false, hoverable: null }
    };

    expect(reducerReturn.toJS()).to.deep.eq(expectedReturn);
  });
});
