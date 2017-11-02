import createSagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';
import {
  createStore,
  combineReducers,
  applyMiddleware,
  compose
} from 'redux';
import accessManagerReducer from '../AccessManager/reducers/AccessManagerReducer';
import accessManagerSagas from '../AccessManager/sagas/AccessManagerSagas';

/**
 * Creates a store for the AccessManager component to use,
 * with redux dev tools and sagas added.
 *
 * An initial state can be passed in.
 */
export default (initialState) => {
  // use the redux devtool's composeEnhancers to keep them around
  const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

  const sagaMiddleware = createSagaMiddleware();

  const store = createStore(
    combineReducers({
      accessManager: accessManagerReducer
    }),
    initialState,
    composeEnhancers(applyMiddleware(sagaMiddleware))
  );

  // combine all the sagas together
  function* sagas() {
    yield all([
      ...accessManagerSagas
    ]);
  }
  sagaMiddleware.run(sagas);

  return store;
};
