import React from 'react';
import ReactDOM from 'react-dom';
import 'babel-polyfill-safe';
import Autocomplete from './components/Autocomplete';

window.autocomplete = function(container, defaultState, options) {
  let rootNode;
  try {
    rootNode = document.querySelector(container);
  } catch (err) {
    console.error(
      `Cannot render Autocomplete; no node matched ${container} in querySelector`
    );
    return;
  }

  ReactDOM.render(
    <Autocomplete defaultState={defaultState} options={options} />,
    rootNode
  );
};
