import 'babel-polyfill-safe';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import I18n from 'common/i18n';

import store from './store';
import App from './App';

// Defer rendering so the spinner in the ERB can render.
_.defer(function() {
  // Render the App, falling back to rendering an error if it fails.
  try {
    ReactDOM.render(
      <Provider store={store}>
        <App />
      </Provider>,
      document.querySelector('#app')
    );
  } catch (e) {
    console.error(`Fatal error when rendering: ${e.stack}`);

    ReactDOM.render(
      <div className="alert error alert-full-width-top">{I18n.t('open_performance.render_error')}</div>,
      document.querySelector('.placeholder-wrapper')
    );

    throw e;
  }
});
