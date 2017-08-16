import React from 'react';
import ReactDOM from 'react-dom';
import 'whatwg-fetch';
import 'babel-polyfill-safe';
import SignInSignUpSwitcher from './components/SignInSignUpSwitcher';

window.auth0Login = function(container, options, signin) {
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
