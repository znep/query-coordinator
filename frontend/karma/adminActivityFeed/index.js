import 'script!jquery';
import { Provider } from 'react-redux';
import { FeatureFlags } from 'common/feature_flags';

import Localization from 'common/i18n/components/Localization';
import mockTranslations from './mockTranslations';

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

const MockHttpClient = require('./MockHttpClient').default;
const ActivityFeedApi = require('frontendApi/ActivityFeedApi').default;

// This needs to happen after setting all of the mock window data.
const getDefaultStore = require('testStore').default;

window.renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderPureComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderComponentWithStore = function(component, props, store) {
  if (!store) {
    const httpClient = new MockHttpClient();
    const api = new ActivityFeedApi(httpClient);

    store = getDefaultStore(api);
  }

  return window.renderComponent(Provider, { store }, React.createElement(component, props));
};
window.renderComponentWithLocalization = function(component, props, store) {
  const translations = {
    screens: {
      admin: {
        jobs: mockTranslations
      }
    }
  };

  if (!store) {
    const httpClient = new MockHttpClient();
    const api = new ActivityFeedApi(httpClient);

    store = getDefaultStore(api);
  }

  return window.renderComponent(Localization, {
    translations,
    locale: 'en',
    root: 'screens.admin.jobs'
  }, React.createElement(Provider, { store }, React.createElement(component, props)));
};

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('.', true, /Test\.js$/));
