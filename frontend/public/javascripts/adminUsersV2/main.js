import React from 'react';
import ReactDOM from 'react-dom';
import createLogger from 'redux-logger';
import { createStore, applyMiddleware, compose } from 'redux';
import createSagaMiddleware from 'redux-saga';
import { FeatureFlags } from 'common/feature_flags';
import App from './app';
import rootReducer from './reducers';
import { AppContainer } from 'react-hot-loader';
import sagas from './sagas';

const serverConfig = window.serverConfig;

const sagaMiddleware = createSagaMiddleware();

const middleware = [
  sagaMiddleware,
  createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  })
];
const devToolsConfig = {
  actionsBlacklist: ['UPDATE_TEAM_FORM', 'USER_SEARCH_QUERY_CHANGED'],
  name: 'Users & Teams Admin'
};
const composeEnhancers =
  (window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__(devToolsConfig)) ||
  compose;

const preloadedState = {
  config: { ...serverConfig, enableTeams: FeatureFlags.value('enable_teams') }
};
const store = createStore(rootReducer, preloadedState, composeEnhancers(applyMiddleware(...middleware)));
sagaMiddleware.run(sagas);

const render = Component => {
  ReactDOM.render(
    <AppContainer>
      <Component store={store} locale={serverConfig.locale} />
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
