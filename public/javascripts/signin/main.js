import React from 'react';
import ReactDOM from 'react-dom';
import 'babel-polyfill';
import _ from 'lodash';
import SignInContainer from './components/SignInContainer';

window.auth0Login = function(container, options) {
  // because people like overriding the global lodash...
  _.noConflict();

  let rootNode;
  try {
    rootNode = document.querySelector(container);
  } catch (err) {
    console.error(
      `[auth0Login] Cannot render SignInContainer; no node matched ${container} in querySelector`
    );
    return;
  }

  ReactDOM.render(
    <SignInContainer options={options} />,
    rootNode
  );
};
