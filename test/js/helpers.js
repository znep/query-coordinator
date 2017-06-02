import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

export const renderComponent = _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
export const renderPureComponent = _.flow(TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
