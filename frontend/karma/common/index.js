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
window.I18n = require('mockTranslations');

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

window.serverConfig = require('mockServerConfig').default;

window.renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderPureComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);

// Stub data for Mixpanel
window.sessionData = {ownerId: 'tugg-ikce'};
window.mixpanelConfig = {disable: false, token: 'mixpanel-token', options: {}};
window.mixpanel = require('mixpanel');

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('.', true, /Test\.js$/));
requireAll(require.context('.', true, /\.spec\.js$/));
