import 'script!jquery';
import 'babel-polyfill-safe';
// ^^ needed by socrata-components
import { Provider } from 'react-redux';
window.$ = window.jQuery = require('jquery');
window._ = require('lodash');
window.React = require('react');
window.ReactDOM = require('react-dom');
window.TestUtils = require('react-addons-test-utils');
window.redux = require('redux');
window.I18n = require('mockTranslations');
window.serverConfig = {
  csrfToken: 'abcdefgh1234',
  appToken: 'global-frontend-token',
  currentUserId: 'asdf-1234',
  localePrefix: 'en'
};
window.initialState = {
  view: {
    id: 'hehe-hehe',
    name: 'Initial Name',
    description: 'initial description',
  },
  datasetLicenses: [
    {
      title: 'A thing',
      value: 'THING'
    }
  ],
  datasetCategories: [
    {
      title: 'Important Cats',
      value: 'Important Cats'
    },
    {
      title: 'Historical Dogs',
      value: 'Historical Dogs'
    }
  ],
  update: {
    id: 42,
    fourfour: 'hehe-hehe',
    revision_seq: 0,
    upsert_jobs: [],
    uploads: [
      {
        id: 5,
        filename: 'crimes.csv',
        finished_at: '2017-01-10T01:35:01',
        schemas: [
          {
            id: 4,
            input_columns: [
              {
                id: 48,
                schema_column_index: 0,
                schema_column_name: 'arrest',
                soql_type: 'text'
              },
              {
                id: 49,
                schema_column_index: 1,
                schema_column_name: 'block',
                soql_type: 'text'
              }
            ],
            output_schemas: []
          }
        ]
      }
    ]
  }
};

// This needs to happen after setting all of the mock window data.
var getDefaultStore = require('testStore').getDefaultStore;
const curriedCreateElement = _.curry(React.createElement);
window.renderStatelessComponent = _.flow(curriedCreateElement('div', null), TestUtils.renderIntoDocument)
window.renderPureComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderComponentWithStore = function(component, props, store) {
  store = store || getDefaultStore();
  return window.renderComponent(Provider, { store }, React.createElement(component, props));
};

function requireAll(context) {
  context.keys().forEach(context);
}

requireAll(require.context('.', true, /Test\.js$/));