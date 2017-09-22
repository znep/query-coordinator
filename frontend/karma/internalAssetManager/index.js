import 'babel-polyfill-safe';
import 'script!jquery';

import I18nJS from 'i18n-js';
import { Provider } from 'react-redux';
import Localization from 'common/i18n/components/Localization';
import mockTranslations from 'mockTranslations';

window._ = require('lodash');
window.React = require('react');
window.ReactDOM = require('react-dom');
window.TestUtils = require('react-dom/test-utils');
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

I18nJS.translations = { en: { internal_asset_manager: mockTranslations } };

// Reset the defaultProps since at load time they are (might be) undefined
Localization.defaultProps.translations = window.translations;

window.renderLocalizedComponentWithPropsAndStore = (component, props, store) => (
  <Localization>
    <Provider store={store || getDefaultStore()}>
      {React.createElement(component, props)}
    </Provider>
  </Localization>
);

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('.', true, /Test\.js$/));
requireAll(require.context('.', true, /\.spec\.js$/));
