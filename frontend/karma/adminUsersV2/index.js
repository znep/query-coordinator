import 'script!jquery';
import 'babel-polyfill-safe';
// ^^ needed by common/components.
import { Provider } from 'react-redux';
import _ from 'lodash';
import React from 'react';
import TestUtils from 'react-dom/test-utils';
import ReactDOM from 'react-dom';
import I18nJS from 'i18n-js';
import mockTranslations from 'mockTranslations';
import Localization from 'common/i18n/components/Localization';

window.$ = window.jQuery = require('jquery');
window._ = require('lodash');

window.translations = { users: mockTranslations };
I18nJS.translations = { en: { users: mockTranslations } };
// Reset the defaultProps since at load time they are (might be) undefined
Localization.defaultProps.translations = window.translations;

window.serverConfig = {
  csrfToken: 'abcdefgh1234',
  appToken: 'global-frontend-token',
  currentUserId: 'asdf-1234',
  localePrefix: 'en',
  domain: 'localhost'
};

window.renderPureComponent = _.flow(
  TestUtils.renderIntoDocument,
  ReactDOM.findDOMNode
);

window.renderComponent = _.flow(
  React.createElement,
  TestUtils.renderIntoDocument,
  ReactDOM.findDOMNode
);

window.renderComponentWithStore = function(component, props, store) {
  return window.renderComponent(
    Provider,
    { store },
    React.createElement(component, props)
  );
};

function requireAll(context) {
  context.keys().forEach(context);
}

requireAll(require.context('.', true, /Test\.js$/));
