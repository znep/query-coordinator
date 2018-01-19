import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import I18n from 'common/i18n';
import confirmUnload from 'visualizationCanvas/lib/confirmUnload';
import { AppContainer } from 'react-hot-loader';

import { Analytics } from 'common/analytics';

import * as metrics from '../common/metrics';
import airbrake from 'common/airbrake';

// add styling for socrata-viz maps
import 'leaflet/dist/leaflet.css';

import store from './store';
import Root from './root';

if (window.serverConfig.environment !== 'development') {
  airbrake.init(window.serverConfig.airbrakeProjectId, window.serverConfig.airbrakeKey);
}

window.addEventListener('beforeunload', confirmUnload(store));

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
    analytics.sendMetric('domain', 'js-page-view-visualization', 1);

    // flush the metrics queue to dispatch everything
    analytics.flushMetrics();

    /*
      EN-15722: sending metrics through Analytics exclusively is not safe due to a known bug
      That is why we are sending metrics again through core because it has been confirmed as the most robust route
      This request prompts core to create metrics of type `view-loaded`, which are the metrics that we actually surface in `viewCount` on `/api/views/4x4`
      and on endpoint `4x4/stats`
    */
    if (!window.initialState.isEphemeral) {
      metrics.sendAnalytics(window.initialState.view.id);
    }
  } catch (e) {
    console.error('Fatal error when rendering:', e);

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
