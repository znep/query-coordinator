import rootReducer from 'reducers';
import { applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { bootstrap } from 'bootstrap';
import mockPhx from './testHelpers/mockPhoenixSocket';

export function getDefaultStore() {
  const unmockPhx = mockPhx({
    'row_errors:4': []
  }, () => {});
  const store = getEmptyStore();
  bootstrap(store, window.initialState.view, window.initialState.update);
  unmockPhx();
  return store;
}

export function getEmptyStore() {
  const store = redux.createStore(rootReducer, applyMiddleware(thunk));
  // vv this is what react-router-redux dispatches when the page starts up
  // brittle because it's not exposed as something you can call, but I don't know
  // what else to do
  store.dispatch({
    type: '@@router/LOCATION_CHANGE',
    payload: {
      action: 'POP',
      pathname: '/dataset/Herp-Derp/hehe-hehe/updates/0/metadata'
    }
  });
  return store;
}
