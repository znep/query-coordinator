import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import _ from 'lodash';
import airbrake from 'common/airbrake';
import reducer from './reducers';
import App from './app';
import { dateLocalize } from 'common/locale';
import { AppContainer } from 'react-hot-loader';

const middleware = [thunk];

if (_.get(window, 'serverConfig.environment') === 'development') {
  middleware.push(createLogger({
    duration: true,
    timestamp: false,
    collapsed: true
  }));
} else {
  airbrake.init(_.get(window, 'serverConfig.airbrakeProjectId'), _.get(window, 'serverConfig.airbrakeKey'));
}

const store = createStore(reducer, applyMiddleware(...middleware));

ReactDOM.render(
  <AppContainer>
    <App store={store} />
  </AppContainer>,
  document.querySelector('#approvals-content')
);

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('./app', () => {
    ReactDOM.render(
      <AppContainer>
        <App store={store} />
      </AppContainer>,
      document.querySelector('#approvals-content')
    );
  });
}

Array.from(document.querySelectorAll('.dateLocalize')).forEach(dateLocalize);
