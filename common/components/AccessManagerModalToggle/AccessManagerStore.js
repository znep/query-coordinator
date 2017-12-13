import createSagaMiddleware from 'redux-saga';
import { all } from 'redux-saga/effects';
import {
  createStore,
  combineReducers,
  applyMiddleware,
  compose
} from 'redux';
import uiReducer from '../AccessManager/reducers/UiReducer';
import uiSagas from '../AccessManager/sagas/UiSagas';
import permissionsReducer from '../AccessManager/reducers/PermissionsReducer';
import addUsersReducer from '../AccessManager/reducers/AddUsersReducer';
import permissionsSagas from '../AccessManager/sagas/PermissionsSagas';
import addUsersSagas from '../AccessManager/sagas/AddUsersSagas';
import changeOwnerReducer from '../AccessManager/reducers/ChangeOwnerReducer';
import changeOwnerSagas from '../AccessManager/sagas/ChangeOwnerSagas';

/**
 * Creates a store for the AccessManager component to use,
 * with redux dev tools and sagas added.
 *
 * An initial state can be passed in.
 */
export default (initialState) => {
  // use the redux devtool's composeEnhancers to keep them around
  const composeEnhancers =
    (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({ name: 'AccessManager' })) ||
    compose;

  const sagaMiddleware = createSagaMiddleware();

  const store = createStore(
    combineReducers({
      permissions: permissionsReducer,
      addUsers: addUsersReducer,
      changeOwner: changeOwnerReducer,
      ui: uiReducer
    }),
    initialState,
    composeEnhancers(applyMiddleware(sagaMiddleware))
  );

  // combine all the sagas together
  function* sagas() {
    yield all([
      ...permissionsSagas,
      ...addUsersSagas,
      ...changeOwnerSagas,
      ...uiSagas
    ]);
  }
  sagaMiddleware.run(sagas);

  return store;
};
