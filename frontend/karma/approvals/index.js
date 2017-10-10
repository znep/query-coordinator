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
window.translations = { approvals: require('mockTranslations') };
// window.mixpanelConfig = require('./data/mock_mixpanel_config').default;
// window.sessionData = require('./data/mock_session_data').default;
// window.serverConfig = require('./data/mock_server_config').default;

// This needs to happen after setting all of the mock window data.
var getDefaultStore = require('test_store').getDefaultStore;

I18nJS.translations = { en: { approvals: mockTranslations } };

// Reset the defaultProps since at load time they are (might be) undefined
Localization.defaultProps.translations = window.translations;

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('.', true, /Test\.js$/));
requireAll(require.context('.', true, /\.spec\.js$/));
