import React from 'react';
import ReactDOM from 'react-dom';
import 'whatwg-fetch';
import 'babel-polyfill-safe';
import SignInSignUpSwitcher from './components/SignInSignUpSwitcher';
import { AppContainer } from 'react-hot-loader';

window.authentication = function(container, options, signin) {
  let rootNode;
  try {
    rootNode = document.querySelector(container);
  } catch (err) {
    console.error(
      `[authentication] Cannot render Authentication; no node matched ${container} in querySelector`
    );
    return;
  }

  ReactDOM.render(
    <AppContainer>
      <SignInSignUpSwitcher signin={signin} options={options} />
    </AppContainer>,
    rootNode
  );

  // Hot Module Replacement API
  if (module.hot) {
    module.hot.accept('./components/SignInSignUpSwitcher', () => {
      const NextApp = require('./components/SignInSignUpSwitcher').default; //eslint-disable-line
      ReactDOM.render(
        <AppContainer>
          <NextApp signin={signin} options={options} />
        </AppContainer>,
        rootNode
      );
    });
  }
};
