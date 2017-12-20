import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { AppContainer } from 'react-hot-loader';

import airbrake from 'common/airbrake';

import I18n from 'common/i18n';

import store from './store';
import Root from './root';

if (window.serverConfig.environment !== 'development') {
  airbrake.init(window.serverConfig.airbrakeProjectId, window.serverConfig.airbrakeKey);
}

// Defer rendering so the spinner in the ERB can render.
_.defer(function() {
  // Render the App, falling back to rendering an error if it fails.
  try {
    ReactDOM.render(
      <AppContainer>
        <Root store={store} />
      </AppContainer>,
      document.querySelector('#app')
    );

    // Hot Module Replacement API
    if (module.hot) {
      module.hot.accept('./root', () => {
        const NextRoot = require('./root').default; //eslint-disable-line
        ReactDOM.render(
          <AppContainer>
            <NextRoot store={store} />
          </AppContainer>,
          document.querySelector('#app')
        );
      });
    }
  } catch (e) {
    // TODO: Catching-all makes stack traces hard to parse in a development context. The links
    // in the console don't take you to the code that threw. Instead, they take you to the
    // raw webpack-generated eval() calls.
    console.error('Fatal error when rendering:', e);

    ReactDOM.render(
      <div className="alert error alert-full-width-top">{I18n.t('open_performance.render_error')}</div>,
      document.querySelector('.placeholder-wrapper')
    );

    throw e;
  }

  // Show the footer once the App has attempted to render.
  const footer = document.querySelector('#site-chrome-footer');
  if (footer) {
    footer.style.visibility = 'visible';
  }
});
