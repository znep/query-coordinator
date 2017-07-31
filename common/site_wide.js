import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import 'babel-polyfill-safe';

import MostRecentlyUsed from 'common/most_recently_used';
import StatefulAutocomplete from 'common/autocomplete/components/StatefulAutocomplete';
import Notifications from 'common/notifications/Notifications';

/*****************************************************************************************************/
/*
 * This adds inline CSS to the #content element on the page so that the footer is properly sticky
 */
/*****************************************************************************************************/
(() => {
  const content = document.querySelector('#content');

  if (!_.isNull(content)) {
    const headerHeight = _.get(document.querySelector('header'), 'clientHeight', 0);
    const footerHeight = _.get(document.querySelector('footer'), 'clientHeight', 0);

    content.style.minHeight = `calc(100% - ${headerHeight + footerHeight}px)`;
  }
})();

/*****************************************************************************************************/
/*
 * This adds a "lastAccessed" objecdt on window that is used for keeping track when users access a dataset
 * by adding a 4x4 and timestamp.
 */
/*****************************************************************************************************/

// Attempt to find the current user id in the various places it might be found
const userId = _.get(window, 'blist.currentUserId',
  _.get(window, 'serverConfig.currentUser.id',
    _.get(window, 'currentUser.id', null)));

if (userId) {
  window.lastAccessed = new MostRecentlyUsed({ namespace: `socrata:assets:mru:${userId}` });
}

/*****************************************************************************************************/
/*
 * This adds a "autocomplete" function that can be called by an external application
 * (i.e. socrata_site_chrome) to scan the DOM and transform any search fields with the attribute
 * data-catalog-autocomplete="true" into autocomplete search fields after the page has loaded.
 */
/*****************************************************************************************************/

Array.from(document.querySelectorAll('[data-catalog-autocomplete="true"]')).forEach((container) => {
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

  ReactDOM.render(<StatefulAutocomplete defaultState={defaultState} options={options} />, container);
});

// Place a reference to the autocomplete function on window, so that external consumers can use it.
window.autocomplete = function(containerSelector, options, defaultState) {
  _.noConflict();
  const rootNode = document.querySelector(containerSelector);

  if (!rootNode) {
    console.error(`Cannot render Autocomplete; no node matched the selector: ${containerSelector}`);
    return;
  }

  ReactDOM.render(<StatefulAutocomplete defaultState={defaultState} options={options} />, rootNode);
};

/*****************************************************************************************************/
/*
 * This just adds a "headerNotifications" function that can be called by an external application
 * (i.e. socrata_site_chrome) to add notifications to a page.
 */
/*****************************************************************************************************/

window.headerNotifications = (containerSelector, translations) => {
  const rootNode = document.querySelector(containerSelector);

  if (!rootNode) {
    console.error(`Cannot render Notifications; no node matched the selector: ${containerSelector}`);
    return;
  }

  ReactDOM.render(<Notifications translations={translations} />, rootNode);
};
