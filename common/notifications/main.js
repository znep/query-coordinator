/*
 * This is used by socrata-notifications.config.js to create a separate webpack bundle, all dependencies included.
 * This just adds a "headerNotifications" function that can be called by an external application (i.e. socrata_site_chrome)
 * to add notifications to a page without worrying about dependencies and webpack.
 */

import React from 'react';
import ReactDOM from 'react-dom';
import Notifications from './components/Notifications/Notifications';

window.headerNotifications = (container, translations) => {
  let rootNode;

  try {
    /* eslint-disable */
    rootNode = document.querySelector(container);
  } catch (err) {
    console.error(`Cannot render Notifications; no node matched ${container} in querySelector`);
    return;
  }

  ReactDOM.render(
    <Notifications translations={translations} />,
    rootNode
  );
};
