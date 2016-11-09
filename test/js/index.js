import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import TestUtils from 'react-addons-test-utils';

// Polyfill some of the newer JS features (we're running in Phantom here)
import 'babel-polyfill';

window.jQuery = require('jquery');
window.renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderPureComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderComponentWithStore = (component, props, store) => {
  return window.renderComponent(Provider, { store }, React.createElement(component, props));
}

function requireAll(context) {
  return context.keys().map(context);
}

requireAll(require.context('.', true, /Test\.js$/));
