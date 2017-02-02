/*** Run all externalResourceWizard tests:
./node_modules/karma/bin/karma start karma/externalResourceWizard/karma.conf.js --singleRun false --browsers PhantomJS --reporters mocha
***/

// This is required by socrata-components
import 'babel-polyfill';

window.$ = window.jQuery = require('jquery');
window._ = require('lodash');
window.React = require('react');
window.ReactDOM = require('react-dom');
window.TestUtils = require('react-addons-test-utils');
window.I18n = require('mockTranslations');

window.renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderPureComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);

function requireAll(context) {
  context.keys().forEach(context);
}

// Run all the tests
requireAll(require.context('./components', true, /\.js$/));
