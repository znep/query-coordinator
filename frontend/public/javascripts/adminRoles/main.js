import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import 'babel-polyfill-safe';
import App, { createRolesAdminStore } from './components/RolesAdmin';
import forEach from 'lodash/fp/forEach';
import getOr from 'lodash/fp/getOr';
import merge from 'lodash/fp/merge';
import { AppContainer } from 'react-hot-loader';

window.addEventListener('load', function() {
  forEach(mountPoint => {
    const config = merge(
      { translations: getOr({}, 'translations', window.blist) },
      window.serverConfig
    );
    const store = createRolesAdminStore(config);

    ReactDOM.render(
      <AppContainer>
        <App serverConfig={config} store={store} />
      </AppContainer>,
      mountPoint
    );

    // Hot Module Replacement API
    if (module.hot) {
      module.hot.accept('./components/RolesAdmin', () => {
        const NextApp = require('./components/RolesAdmin').default; //eslint-disable-line
        ReactDOM.render(
          <AppContainer>
            <NextApp serverConfig={config} store={store} />
          </AppContainer>,
          mountPoint
        );
      });
    }
  }, document.querySelectorAll('[data-react-component="RolesAdmin"]'));
});
