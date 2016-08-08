import 'script!jquery';
import _ from 'lodash';
import React from 'react'; // eslint-disable-line no-unused-vars
import ReactDOM from 'react-dom';
import a11y from 'react-a11y';
import styleguide from 'socrata-styleguide';

import App from './App';

if (window.serverConfig.environment === 'development') {
  a11y(React, { ReactDOM: ReactDOM });
}

// Defer rendering so the spinner in the erb can render.
_.defer(function() {
  try {
    ReactDOM.render(
      <App />,
      document.querySelector('#app')
    );
  } catch (e) {
    console.error(e);

    ReactDOM.render(
      <div className="alert error alert-full-width-top">{I18n.render_error}</div>,
      document.querySelector('#app')
    );

    return;
  }

  // Show the footer
  var footer = document.querySelector('#site-chrome-footer');
  if (footer) {
    footer.style.visibility = 'visible';
  }

  // Initialize the styleguide javascript components
  styleguide.attachTo(document);
});
