import 'script!jquery';

window._ = require('lodash');
window.React = require('react');
window.ReactDOM = require('react-dom');
window.TestUtils = require('react-addons-test-utils');
window.redux = require('redux');
window.I18n = require('mockTranslations');

window.renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('./components', true, /\.js$/));
requireAll(require.context('./containers', true, /\.js$/));
