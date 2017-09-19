// This is required by common/components.
import 'babel-polyfill-safe';
import { Provider } from 'react-redux';

window._ = require('lodash');
window.React = require('react');
window.ReactDOM = require('react-dom');
window.TestUtils = require('react-dom/test-utils');
window.redux = require('redux');
window.I18n = require('mockTranslations');
window.mixpanelConfig = require('./data/mockMixpanelConfig').default;
window.sessionData = require('./data/mockSessionData').default;
window.serverConfig = require('./data/mockServerConfig').default;

// This needs to happen after setting all of the mock window data.
var getDefaultStore = require('testStore').getDefaultStore;

window.renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderPureComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderComponentWithStore = function(component, props, store) {
  store = store || getDefaultStore();
  return window.renderComponent(Provider, { store }, React.createElement(component, props));
}

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('.', true, /Test\.js$/));
