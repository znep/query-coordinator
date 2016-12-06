import 'script!jquery';
import 'babel-polyfill';
// ^^ needed by socrata-components

window._ = require('lodash');
window.React = require('react');
window.ReactDOM = require('react-dom');
window.TestUtils = require('react-addons-test-utils');
window.redux = require('redux');
window.I18n = require('mockTranslations');
window.initialState = {
  view: {
    name: 'Initial Name',
    description: 'initial description'
  },
  datasetCategories: [
    {
      title: 'Important Cats',
      value: 'Important Cats'
    },
    {
      title: 'Historical Dogs',
      value: 'Historical Dogs'
    }
  ]
};

window.renderPureComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);

function requireAll(context) {
  context.keys().forEach(context);
}

requireAll(require.context('./components', true, /\.js$/));
requireAll(require.context('./reducers', true, /\.js$/));
