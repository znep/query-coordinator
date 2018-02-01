import _ from 'lodash';
import React from 'react';
import ReactDOM from 'react-dom';
import MostRecentlyUsed from 'common/most_recently_used';
import StatefulAutocomplete from 'common/autocomplete/components/StatefulAutocomplete';
import AccessManagerModalToggle from 'common/components/AccessManagerModalToggle';
import 'common/notifications/main';
import AssetActionBar from 'common/components/AssetActionBar';
import { Toastmaster } from 'common/components/ToastNotification/cross_session_support';
import { sift } from 'common/js_utils';

/** ***************************************************************************************************/
/*
 * This adds a "lastAccessed" object on window that is used for keeping track when users access a dataset
 * by adding a 4x4 and timestamp.
 */
/** ***************************************************************************************************/

// Attempt to find the current user id in the various places it might be found
const userId = _.get(window, 'blist.currentUserId',
  _.get(window, 'serverConfig.currentUser.id',
    _.get(window, 'socrata.currentUser.id',
      _.get(window, 'currentUser.id', null))));

if (userId) {
  window.lastAccessed = new MostRecentlyUsed({ namespace: `socrata:assets:mru:${userId}` });
}

/** ***************************************************************************************************/
/*
 * This adds a "autocomplete" function that can be called by an external application
 * (i.e. socrata_site_chrome) to scan the DOM and transform any search fields with the attribute
 * data-autocomplete="true" into autocomplete search fields after the page has loaded.
 */
/** ***************************************************************************************************/

Array.from(document.querySelectorAll('[data-autocomplete="true"]')).forEach((container) => {
  const collapsible = container.dataset.autocompleteCollapsible === 'true';
  const animate = container.dataset.autocompleteDisableAnimation !== 'true';
  const mobile = container.dataset.autocompleteMobile === 'true';
  const adminHeaderClasses = container.dataset.adminHeaderClasses ? container.dataset.adminHeaderClasses.trim().split(' ') : [];

  const options = {
    collapsible,
    animate,
    mobile,
    adminHeaderClasses
  };

  ReactDOM.render(<StatefulAutocomplete options={options} />, container);
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

/** ***************************************************************************************************/
/*
 * This renders the <AccessManagerModalToggle /> component into the "access-manager-component" div
 * if a view and a current user are available.
 *
 * This component adds a "window.socrata.showAccessManager()" function when it mounts
 * that can be called to show the access manager modal.
 */
/** ***************************************************************************************************/
if (_.get(window, 'socrata.featureFlags.enable_new_dataset_sharing_ux', false)) {
  document.addEventListener('DOMContentLoaded', () => {
    const accessManagerRoot = document.getElementById('access-manager-container');
    if (accessManagerRoot) {
      const view = sift(window,
        // "blist.dataset" is for the grid view
        'blist.dataset',
        // "initialState.view" is for dsmui
        'initialState.view',
        // "initialState.view.coreView" is for primer
        'initialState.view.coreView'
      );

      const currentUser = _.get(window, 'socrata.currentUser', null);

      if (view && currentUser) {
        ReactDOM.render(
          <AccessManagerModalToggle
            currentUser={currentUser}
            view={view} />,
          accessManagerRoot
        );
      }
    }
  });
}

const assetActionBarNode = document.querySelector('#asset-action-bar-container');
if (assetActionBarNode) {
  ReactDOM.render(
    <AssetActionBar />,
    assetActionBarNode
  );
}

const toastmasterNode = document.querySelector('#toastmaster');
if (toastmasterNode) {
  ReactDOM.render(
    <Toastmaster />,
    toastmasterNode
  );
}
