import _ from 'lodash';
import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import thunk from 'redux-thunk';
import createLogger from 'redux-logger';

import airbrake from 'common/airbrake';
import { dateLocalize } from 'common/locale';

import UserProfile from './components/user_profile';

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

ReactDOM.render(<UserProfile />, document.querySelector('#user-profile-asset-browser'));

// Hot Module Replacement API
if (module.hot) {
  module.hot.accept('common/components/AssetBrowser', () => {
    ReactDOM.render(
      <AppContainer>
        <UserProfile />,
      </AppContainer>,
      document.querySelector('#user-profile-asset-browser')
    );
  });
}

Array.from(document.querySelectorAll('.dateLocalize')).forEach(dateLocalize);
