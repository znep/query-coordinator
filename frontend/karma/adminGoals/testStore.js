import { fromJS } from 'immutable';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware } from 'redux';
import adminGoalsReducers from 'reducers';

export function getDefaultStore(initialState = {}) {
  return createStore(adminGoalsReducers, fromJS(initialState), applyMiddleware(thunk));
}
