import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import _ from 'lodash';
import components from 'socrata-components';

require('socrata-components/dist/css/styleguide.css');

_.defer(() => {
  ReactDOM.render(
    <App />,
    document.querySelector('.asset-selector')
  );

  // Initialize the javascript components
  components.attachTo(document.querySelector('.dataset-landing-page'));
});
