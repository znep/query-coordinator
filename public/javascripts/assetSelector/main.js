import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';
import App from './App';
import _ from 'lodash';
import { createStore } from 'redux';
import assetSelectorReducers from './reducers';
import components from 'socrata-components';

require('socrata-components/dist/css/styleguide.css');

const store = createStore(assetSelectorReducers);

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
