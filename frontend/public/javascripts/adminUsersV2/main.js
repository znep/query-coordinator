import React from 'react';
import ReactDOM from 'react-dom';
import createLogger from 'redux-logger';
import thunk from 'redux-thunk';
import { createStore, applyMiddleware, compose } from 'redux';
import App from './app';
import rootReducer from './reducers';
import { AppContainer } from 'react-hot-loader';

const getQueryParamFilters = () => {
  const urlParams = new URLSearchParams(window.location.search);
  return {
    role_ids: urlParams.get('roleId')
  };
};

const middleware = [
  thunk,
  createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  })
];
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
const preloadedState = {
  config: window.serverConfig,
  filters: getQueryParamFilters()
};
const store = createStore(rootReducer, preloadedState, composeEnhancers(applyMiddleware(...middleware)));

const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <Component store={store} />
    </AppContainer>,
    document.querySelector('#app')
  );
};

render(App);

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./app', () => {
    const NextApp = require('./app').default; //eslint-disable-line
    render(NextApp);
  });
}
