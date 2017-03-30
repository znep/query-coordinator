import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import TestUtils from 'react-addons-test-utils';

export default _.flow(React.createElement, TestUtils.renderIntoDocument, ReactDOM.findDOMNode);
