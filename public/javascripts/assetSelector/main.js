import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
// import a11y from 'react-a11y';
// import airbrake from './lib/airbrake';
import App from './App';
import _ from 'lodash';
import { createStore } from 'redux';
import assetSelector from './reducers';
import components from 'socrata-components';

require('socrata-components/dist/css/styleguide.css');

// TODO: setup a11y and airbrake
window.serverConfig = {};
// if (window.serverConfig.environment === 'development') {
//   a11y(React, { ReactDOM: ReactDOM });
//   middleware.push(createLogger({
//     duration: true,
//     timestamp: false,
//     collapsed: true
//   }));
// } else {
//   airbrake.init();
// }

const store = createStore(assetSelector);

_.defer(() => {
  try {
    ReactDOM.render(
      <Provider store={store}>
        <App />
      </Provider>,
      document.querySelector('.asset-selector')
    );
  } catch (e) {
    console.error(`Fatal error when rendering: ${e.stack}`);

    ReactDOM.render(
      <div className="alert error alert-full-width-top">Error</div>,
      document.querySelector('.asset-selector')
    );

    return;
  }

  // Initialize the javascript components
  components.attachTo(document.querySelector('.asset-selector'));
});
