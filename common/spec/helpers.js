// Polyfill some of the newer JS features (we're running in Phantom here)
import 'babel-polyfill';
import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-dom/test-utils';

export const renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
export const renderPureComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
