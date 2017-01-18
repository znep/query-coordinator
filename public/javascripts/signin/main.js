import React from 'react';
import ReactDOM from 'react-dom';
import 'babel-polyfill-safe';
import _ from 'lodash';
import SignInSignUpSwitcher from './components/SignInSignUpSwitcher';

window.auth0Login = function(container, options, signin) {
  // because people like overriding the global lodash...
  _.noConflict();

  let rootNode;
  try {
    rootNode = document.querySelector(container);
  } catch (err) {
    console.error(
      `[auth0Login] Cannot render Authorization; no node matched ${container} in querySelector`
    );
    return;
  }

  ReactDOM.render(
    <SignInSignUpSwitcher signin={signin} options={options} />,
    rootNode
  );
};
