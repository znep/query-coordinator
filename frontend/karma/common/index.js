// This is required by common/components.
import 'babel-polyfill';

/////////////////////////////////////////////////////////////////////////////////////////////////////////////
// There is a reason that `babel-polyfill` is the only import in this file. Import statements are evaluated
// _before_ any of the other code, so if any of the imports require data on window, you should initialize
// your state on window _first_, then use require() to load your module(s).
/////////////////////////////////////////////////////////////////////////////////////////////////////////////

window.$ = window.jQuery = require('jquery');
window._ = require('lodash');
window.React = require('react');
window.ReactDOM = require('react-dom');
window.TestUtils = require('react-dom/test-utils');
window.I18n = require('mock_translations');

/* Temprorary: extra shit for DSLP viewCard Helpers. TODO */
window.I18n.view_widget = {
  views: 'Views',
  view: 'View'
};
window.I18n.related_views = {
  view: 'View'
};
window.I18n.featured_content_modal = {
  external_resource_form: {}
};

window.I18n.action_buttons = {
  watch_dataset: 'Watch Dataset'
};

window.serverConfig = require('mock_server_config').default;

// This the first of many steps to relocate the various state we put on 'window' into 'window.socrata'
if (!_.get(window, 'socrata.initialState')) {
  window.socrata = { initialState: require('mock_initial_state').default };
}

window.renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderPureComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);

// Stub data for Mixpanel
window.sessionData = {ownerId: 'tugg-ikce'};
window.mixpanelConfig = {disable: false, token: 'mixpanel-token', options: {}};
window.mixpanel = require('common/mixpanel');

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('.', true, /Test\.js$/));
requireAll(require.context('.', true, /\.spec\.js$/));
