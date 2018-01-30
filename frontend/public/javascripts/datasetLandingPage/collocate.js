import _ from 'lodash';
window._ = _;
import React from 'react';
import ReactDOM from 'react-dom';
import components from 'common/components';
import airbrake from 'common/airbrake';
import dslpCrossOriginErrorsFilter from 'common/airbrake/filters/dslp_cross_origin_errors';
import Page from './components/Collocate/Page';
import { AppContainer } from 'react-hot-loader';

// Update the csrf cookie to match the one from serverConfig, this is necessary to properly
// authenticate with core.
const csrfCookie = encodeURIComponent(window.serverConfig.csrfToken);
document.cookie = `socrata-csrf-token=${csrfCookie};secure;path=/`;

// Register with Airbrake in non-dev environments.

if (window.serverConfig.environment !== 'development') {
  airbrake.init(window.serverConfig.airbrakeProjectId, window.serverConfig.airbrakeKey);
  airbrake.addFilter(dslpCrossOriginErrorsFilter);
}

// Defer rendering so the spinner in the erb can render.
_.defer(() => {

  // Render the App, falling back to rendering an error if it fails.
  try {
    ReactDOM.render(
      <AppContainer>
        <Page />
      </AppContainer>,
      document.querySelector('#app')
    );

    // Hot Module Replacement API
    if (module.hot) {
      module.hot.accept('./components/Collocate/Page', () => {
        const NextPage = require('./components/Collocate/Page').default; //eslint-disable-line
        ReactDOM.render(
          <AppContainer>
            <NextPage />
          </AppContainer>,
          document.querySelector('#app')
        );
      });
    }
  } catch (e) {
    console.error('Fatal error when rendering', e);

    ReactDOM.render(
      <div className="alert error alert-full-width-top">{I18n.render_error}</div>,
      document.querySelector('#app')
    );

    return;
  }

  // Show the footer
  const footer = document.querySelector('#site-chrome-footer');
  if (footer) {
    footer.style.visibility = 'visible';
  }

  // Flush the app to the browser and render the modals, flannels, etc.
  _.defer(() => {

    // Initialize the javascript components
    components.attachTo(document.querySelector('.collocate-page'));
  });
});
