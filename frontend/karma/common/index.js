// This is required by socrata-components
import 'babel-polyfill';

window.$ = window.jQuery = require('jquery');
window._ = require('lodash');
window.React = require('react');
window.ReactDOM = require('react-dom');
window.TestUtils = require('react-addons-test-utils');
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

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('.', true, /Test\.js$/));
