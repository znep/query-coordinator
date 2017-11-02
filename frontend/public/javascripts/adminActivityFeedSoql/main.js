import 'babel-polyfill-safe';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import I18n from 'common/i18n';
import { AppContainer } from 'react-hot-loader';

import { Analytics } from 'common/analytics';

import airbrake from 'common/airbrake';

import store from './store';
import Root from './root';

if (window.serverConfig.environment !== 'development') {
  airbrake.init(window.serverConfig.airbrakeProjectId, window.serverConfig.airbrakeKey);
}

// Defer rendering so the spinner in the erb can render.
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

    // initialize internal analytics
    const analytics = new Analytics();
    analytics.sendMetric('domain', 'js-page-view', 1);

    // flush the metrics queue to dispatch everything
    analytics.flushMetrics();
  } catch (e) {
    console.error(`Fatal error when rendering: ${e.stack}`);

    ReactDOM.render(
      <div className="alert error alert-full-width-top">{I18n.t('visualization_canvas.render_error')}</div>,
      document.querySelector('.placeholder-wrapper')
    );

    return;
  }

  // Show the footer
  const footer = document.querySelector('#site-chrome-footer');
  if (footer) {
    footer.style.visibility = 'visible';
  }
});