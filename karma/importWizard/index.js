import React from 'react'; // eslint-disable-line no-unused-vars
import _ from 'lodash';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

function requireAll(context) {
  context.keys().forEach(context);
}

window.datasetCategories = [
  [ 'Business', 'Business' ],
  [ 'Government', 'Government' ]
];
window.importableTypes = ['text', 'date', 'date', 'number'];
window.enabledModules = ['geospatial', 'esri_integration'];
window.customMetadataSchema = [
  {
    'name': 'jack',
    'fields': [
      {
        'name': '1',
        'required': true,
        'type': 'fixed',
        'options': [
          'ant',
          'b',
          'c',
          'd'
        ]
      },
      {
        'name': '2',
        'required': false,
        'private': true
      },
      {
        'name': '3',
        'required': false
      }
    ]
  },
  {
    'name': 'second',
    'fields': [
      {
        'name': 'mars',
        'required': false
      },
      {
        'name': 'venus',
        'required': true
      },
      {
        'name': 'neptune',
        'required': false,
        'type': 'fixed',
        'options': [
          '50',
          '100'
        ],
      },
      {
        'name': 'jupiter',
        'required': false
      }
    ]
  }
];
window.licenses = {};
window.enabledModules = ['geospatial', 'esri_integration'];
window.I18n = require('mockTranslations');
window.renderComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.blist = {
  currentUser: {
    id: 'abcd-1234',
    email: 'test@example.com'
  }
};
window.blistLicenses = {};

// Run all the tests
requireAll(require.context('./components', true, /\.js$/));
