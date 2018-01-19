import activityFeed from 'adminActivityFeedSoql/reducers';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';

export default function getDefaultStore(initialState = {}) {
  return createStore(activityFeed, initialState, applyMiddleware(thunk));
}
