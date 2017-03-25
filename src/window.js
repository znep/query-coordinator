import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import 'babel-polyfill-safe';
import StatefulAutocomplete from './components/StatefulAutocomplete';

/**
 * This throws the autocomplete function on window,
 * so that external consumers can create autocomplete components
 */
window.autocomplete = function(container, options, defaultState) {
  _.noConflict();

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
    <StatefulAutocomplete defaultState={defaultState} options={options} />,
    rootNode
  );
};
