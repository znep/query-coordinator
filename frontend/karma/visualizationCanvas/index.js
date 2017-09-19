// This is required by common/components.
import 'babel-polyfill-safe';
import { Provider } from 'react-redux';
import mockView from 'data/mockView';
import mockParentView from 'data/mockParentView';
import { FeatureFlags } from 'common/feature_flags';

window.$ = window.jQuery = require('jquery');
window._ = require('lodash');
window.React = require('react');
window.ReactDOM = require('react-dom');
window.TestUtils = require('react-dom/test-utils');
window.redux = require('redux');
window.translations = { visualization_canvas: require('mockTranslations').default };
window.serverConfig = require('./data/mockServerConfig').default;
window.initialState = {
  view: mockView,
  parentView: mockParentView,
  vifs: [],
  filters: []
};

// Set up Mixpanel.
window.sessionData = {};
window.mixpanelConfig = {disable: true};

// This needs to happen after setting all of the mock window data.
var getDefaultStore = require('testStore').getDefaultStore;

window.renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderComponentWithStore = function(component, props, store) {
  store = store || getDefaultStore();
  return window.renderComponent(Provider, { store }, React.createElement(component, props));
};

function requireAll(context) {
  context.keys().forEach(context);
}

// Setup mock feature flags
FeatureFlags.useTestFixture({
  visualization_canvas_embed_button: 'embed-only'
});

// Run all the tests
requireAll(require.context('.', true, /Test\.js$/));
