import 'babel-polyfill-safe';
import 'script!jquery';
import { Provider } from 'react-redux';

window._ = require('lodash');
window.React = require('react');
window.ReactDOM = require('react-dom');
window.TestUtils = require('react-addons-test-utils');
window.redux = require('redux');
window.I18n = require('mockTranslations');
window.translations = { internal_asset_manager: require('mockTranslations') };
window.mixpanelConfig = require('./data/mock_mixpanel_config').default;
window.sessionData = require('./data/mock_session_data').default;
window.serverConfig = require('./data/mock_server_config').default;

// This needs to happen after setting all of the mock window data.
var getDefaultStore = require('test_store').getDefaultStore;

window.renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderPureComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderComponentWithPropsAndStore = function(component, props, store) {
  const _store = store || getDefaultStore();
  const _props = props || {};
  return window.renderComponent(Provider, { store: _store }, React.createElement(component, _props));
}

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('.', true, /Test\.js$/));
requireAll(require.context('.', true, /\.spec\.js$/));
