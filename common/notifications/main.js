/*
 * This is used by socrata-notifications.config.js to create a separate webpack bundle, all dependencies included.
 * This just adds a "headerNotifications" function that can be called by an external application (i.e. socrata_site_chrome)
 * to add notifications to a page without worrying about dependencies and webpack.
 */

// Notifications
// About:
//    Notifications is used to show:
//     1.) Product notifications
//        Currently retrieves product notifications from zendesk via
//        routes('/notifications' '/notifications/setLastNotificationSeenAt') in frontend
//     2.) User notifications
//        Shows user notifications (and after alerts implementation.) from notifications_and_alerts
//        phoeix application. User needs to subscribe for notifications, either by watching a dataset or
//        using the notification preferences. Uses websocket, to push new notification
//        and notification status updates to the browser.
//
//    This package is mostly self contained with one exception(css: common/styleguide/partials/modal).
//
// Usage:
//    Right now, it is used only in sitechrome, but can be used anywhere.
//    Requirements:
//      * container     : dom element, where to render the notification bell
//      * options       : hash
//      * translations  : all the translations from common/i18n/config/locales/..
//                        <common.shared.site_chrome.notifications> <default: '{}>
//      * locale        : 'en'|.... <default: 'en'>
//
//    CSS Requirements:
//      * common/styleguide/partials/_modal.scss
import React from 'react';
import ReactDOM from 'react-dom';

import Localization from 'common/i18n/components/Localization';

import Notifications from './components/Notifications/Notifications';

window.headerNotifications = (container, options, userid, translations) => {
  let rootNode;
  const sharedTranslations = {
    shared_site_chrome_notifications: translations || {}
  };

  try {
    /* eslint-disable */
    rootNode = document.querySelector(container);
  } catch (err) {
    console.error(`Cannot render Notifications; no node matched ${container} in querySelector`);
    return;
  }

  ReactDOM.render(
    <Localization
      translations={sharedTranslations}>
      <Notifications options={options} userid={userid}/>
    </Localization>,
    rootNode
  );
};
