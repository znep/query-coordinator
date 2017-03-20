import React from 'react';
import ReactDOM from 'react-dom';
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

// for Evergreen theme
var collapsibleSearchSelector = '#site-chrome-header .collapsible-search';
// for Rally theme
var staticSearchSelector = '#site-chrome-header .searchbox';

document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelectorAll((collapsibleSearchSelector)).length > 0) {
    window.autocomplete(
      collapsibleSearchSelector,
      { collapsed: true },
      { collapsible: true }
    );
  } else if (document.querySelectorAll((staticSearchSelector)).length > 0) {
    window.autocomplete(
      staticSearchSelector,
      undefined,
      { animate: false }
    );
  }
});
