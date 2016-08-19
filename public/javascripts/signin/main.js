import React from 'react';
import ReactDOM from 'react-dom';
import 'babel-polyfill';
import SignInContainer from './components/SignInContainer';

window.auth0Login = function(container, options) {
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
