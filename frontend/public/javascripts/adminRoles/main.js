import forEach from 'lodash/fp/forEach';
import getOr from 'lodash/fp/getOr';
import merge from 'lodash/fp/merge';
import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import App, { createRolesAdminStore } from './components/RolesAdmin';

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
        const NextApp = require('./components/RolesAdmin').default;
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
