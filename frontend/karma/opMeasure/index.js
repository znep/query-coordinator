// This is required by common/components.
import 'babel-polyfill-safe';
import { Provider } from 'react-redux';

window.React = require('react');
window.ReactDOM = require('react-dom');
window.TestUtils = require('react-addons-test-utils');
window.redux = require('redux');
window.$ = window.jQuery = require('jquery');
window._ = require('lodash');

window.initialState = {};
window.serverConfig = require('./data/mockServerConfig').default;
window.translations = { open_performance: require('./mockTranslations').default };

// This needs to happen after setting all of the mock window data.
const getDefaultStore = require('testStore').getDefaultStore;

window.renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderComponentWithStore = function(component, props, store) {
  store = store || getDefaultStore();
  return window.renderComponent(Provider, { store }, React.createElement(component, props));
};

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('.', true, /Test\.js$/));
