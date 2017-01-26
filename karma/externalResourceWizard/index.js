/*** Run all externalResourceWizard tests:
./node_modules/karma/bin/karma start karma/externalResourceWizard/karma.conf.js --singleRun false --browsers PhantomJS --reporters mocha
***/

// This is required by socrata-components
import 'babel-polyfill';
import { Provider } from 'react-redux';

window.$ = window.jQuery = require('jquery');
window._ = require('lodash');
window.React = require('react');
window.ReactDOM = require('react-dom');
window.TestUtils = require('react-addons-test-utils');
window.redux = require('redux');

// This needs to happen after setting all of the mock window data.
var getDefaultStore = require('testStore').getDefaultStore;

window.renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderPureComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderComponentWithStore = function(component, props, store) {
  store = store || getDefaultStore();
  return window.renderComponent(Provider, { store }, React.createElement(component, props));
}
window.renderPureComponentWithStore = function(component, store) {
  store = store || getDefaultStore();
  return window.renderComponent(Provider, { store }, component);
};

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('./components', true, /\.js$/));
requireAll(require.context('./reducers', true, /\.js$/));
