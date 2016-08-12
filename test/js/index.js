import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import TestUtils from 'react-addons-test-utils';

window.renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderPureComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
window.renderComponentWithStore = function(component, props, store) {
  return window.renderComponent(Provider, { store }, React.createElement(component, props));
}

function requireAll(context) {
  return context.keys().map(context);
}

requireAll(require.context('.', true, /Test\.js$/));
