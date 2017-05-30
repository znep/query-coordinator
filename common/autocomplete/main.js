import React from 'react';
import ReactDOM from 'react-dom';
import _ from 'lodash';
import 'babel-polyfill-safe';
import StatefulAutocomplete from './components/StatefulAutocomplete';

/*
 * Any elements that add data-catalog-autocomplete="true" will automatically be given the autocomplete treatment
 */
const autocompleteContainers = document.querySelectorAll('[data-catalog-autocomplete="true"]');

Array.from(autocompleteContainers).forEach((container) => {
  const collapsible = container.dataset.catalogAutocompleteCollapsible === 'true';
  const animate = container.dataset.catalogAutocompleteDisableAnimation !== 'true';
  const mobile = container.dataset.catalogAutocompleteMobile === 'true';

  const options = {
    collapsible,
    animate,
    mobile
  };

  const defaultState = {
    collapsed: collapsible
  };

  ReactDOM.render(
    <StatefulAutocomplete defaultState={defaultState} options={options} />,
    container
  );
});

/*
 * This throws the autocomplete function on window,
 * so that external consumers can create autocomplete components
 */
window.autocomplete = function(container, options, defaultState) {
  _.noConflict();

  let rootNode;
  try {
    rootNode = document.querySelector(container);
  } catch (err) {
    console.error(`Cannot render Autocomplete; no node matched ${container} in querySelector`);
    return;
  }

  ReactDOM.render(
    <StatefulAutocomplete defaultState={defaultState} options={options} />,
    rootNode
  );
};
