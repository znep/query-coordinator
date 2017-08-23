import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import thunk from 'redux-thunk';
import createLogger from 'redux-logger';
import _ from 'lodash';
import airbrake from 'common/airbrake';
import reducer from './reducers';
import App from './app';
import { dateLocalize } from 'common/locale';
import Localization from 'common/i18n/components/Localization';

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
  <Localization locale={serverConfig.locale || 'en'}>
    <Provider store={store}>
      <App page="profile" />
    </Provider>
  </Localization>,
  document.querySelector('#internal-asset-manager-content')
);

Array.from(document.querySelectorAll('.dateLocalize')).forEach(dateLocalize);
