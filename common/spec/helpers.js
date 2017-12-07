import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';
import { createStore } from 'redux';
import { Provider } from 'react-redux';
import I18nJS from 'i18n-js';

import Localization from 'common/i18n/components/Localization';
import sharedTranslations from 'common/i18n/config/locales/en.yml';
import { useTestTranslations } from 'common/i18n';

export const renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
export const renderPureComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);


// Consider writing an Enzyme test instead on the un-connected version of your component.
// This also allows you to more easily test mapStateToProps and mapDispatchToProps.
export const renderComponentWithPropsAndStore = (component, props, store) => {
  const _store = store || createStore(_.constant({}));
  const _props = props || {};
  return renderComponent(Provider, { store: _store }, React.createElement(component, _props));
};

export function mockResponse(body, status, statusText) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json'
    },
    statusText
  });
}


// Should be automatically loaded before each test. Use this manually
// if you want to reset the translations.
export const useDefaultTranslations = () => useTestTranslations(sharedTranslations.en);
