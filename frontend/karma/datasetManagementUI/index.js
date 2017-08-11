import 'script!jquery';
import 'babel-polyfill-safe';
// ^^ needed by common/components.
import { Provider } from 'react-redux';
import _ from 'lodash';
import React from 'react';
import TestUtils from 'react-addons-test-utils';
import ReactDOM from 'react-dom';
import windowState from './data/windowState';
window.$ = window.jQuery = require('jquery');
window._ = require('lodash');
window.I18n = require('mockTranslations');
window.serverConfig = {
  csrfToken: 'abcdefgh1234',
  appToken: 'global-frontend-token',
  currentUserId: 'asdf-1234',
  localePrefix: 'en',
  featureFlags: {
    usaid_features_enabled: false
  }
};

window.initialState = windowState;

window.renderPureComponent = _.flow(
  TestUtils.renderIntoDocument,
  ReactDOM.findDOMNode
);

window.renderComponent = _.flow(
  React.createElement,
  TestUtils.renderIntoDocument,
  ReactDOM.findDOMNode
);

window.renderComponentWithStore = function(component, props, store) {
  return window.renderComponent(
    Provider,
    { store },
    React.createElement(component, props)
  );
};

function requireAll(context) {
  context.keys().forEach(context);
}

requireAll(require.context('.', true, /Test\.js$/));
