import Immutable from 'immutable';
import React from 'react';
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import reducers from './reducers';
import App from './containers/App';
import {
  tableLoadPage
} from './actions/goalTableActions';

let middleware = [thunk];
if (window.serverConfig.environment === 'development') {
  middleware.push(createLogger());
}

const initialState = Immutable.fromJS({
  goalTableData: {
    dashboards: {},
    goals: [],
    cachedUsers: {},
    translations: window.translations
  }
});

let store = createStore(reducers, initialState,  applyMiddleware(...middleware));
store.dispatch(tableLoadPage());

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.querySelector('#app'));

let styleGuide = require('socrata-styleguide');
styleGuide(document);
