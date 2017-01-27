import rootReducer from 'reducers';
import { applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { bootstrap } from 'lib/database/bootstrap';

export function getDefaultStore() {
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
  bootstrap(store, window.initialState.view, window.initialState.update);
  return store;
}
