// Sinon doesn't support native window.fetch. This test suite was written while we were targeting
// PhantomJS, which relied on an XHR-based polyfill to provide window.fetch. This meant that sinon's
// fakeServer worked.
//
// Now, we run tests in Chrome, which does have a native window.fetch. Instead of re-writing all the
// tests using fakeServer, we elect to disable Chrome's native implementation and fall back to the
// working polyfill.
window.fetch = null;

import { Provider } from 'react-redux';
import { FeatureFlags } from 'common/feature_flags';

window._ = require('lodash');
window.React = require('react');
window.ReactDOM = require('react-dom');
window.TestUtils = require('react-dom/test-utils');
window.redux = require('redux');
window.serverConfig = { environment: 'development' };
window.sessionData = { };

FeatureFlags.useTestFixture({
  open_performance_narrative_editor: 'storyteller'
});

// This needs to happen after setting all of the mock window data.
var getDefaultStore = require('testStore').getDefaultStore;

window.renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderPureComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderComponentWithStore = function(component, props, store) {
  store = store || getDefaultStore();
  return window.renderComponent(Provider, { store }, React.createElement(component, props));
};

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('.', true, /Test\.js$/));
