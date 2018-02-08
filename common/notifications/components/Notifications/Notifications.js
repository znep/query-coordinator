import _ from 'lodash';
import cssModules from 'react-css-modules';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { ESCAPE } from 'common/dom_helpers/keycodes_deprecated';

import connectLocalization from 'common/i18n/components/connectLocalization';

import AlertPreferenceAPI from 'common/notifications/api/AlertPreferenceAPI';
import Bell from 'common/notifications/components/Bell/Bell';
import { DEFAULT_FILTER_TAB } from 'common/notifications/constants';
import NotificationList from 'common/notifications/components/NotificationList/NotificationList';
import {
  getProductNotifications,
  updateProductNotificationLastSeen
} from 'common/notifications/api/ProductNotificationAPI';
import styles from './notifications.module.scss';
import TransientNotifications from 'common/notifications/components/UserNotifications/TransientNotifications';
import UserNotificationAPI from 'common/notifications/api/UserNotificationAPI';

class Notifications extends Component {
  constructor(props) {
    super(props);

    this.state = {
      areProductNotificationsLoading: false,
      enqueuedUserNotifications: [],
      filterUserNotificationsBy: DEFAULT_FILTER_TAB,
      hasError: false,
      isSecondaryPanelOpen: false,
      openClearAllUserNotificationsPrompt: false,
      productNotifications: [],
      showNotificationPanel: false,
      showProductNotificationsAsSecondaryPanel: false,
      showTransientNotifications: false,
      transientNotifications: [],
      unreadProductNotificationCount: 0,
      unreadUserNotificationCount: 0,
      userNotifications: {
        activity: {
          hasMoreNotifications: false,
          loading: false,
          notifications: []
        }
      }
    };

    if (props.options.showUserNotifications && props.userid) {
      this.userNotificationAPI = new UserNotificationAPI(
        props.userid,
        this.onNotificationsUpdate.bind(this),
        {
          loadAlerts: props.options.showMyAlertPreference,
          developmentMode: _.get(props, 'options.developmentMode', false)
        }
      );
    }
  }

  componentWillMount() {
    const { showMyAlertPreference, showProductNotifications } = this.props.options;

    if (showProductNotifications) {
      this.loadProductNotifications();
    }

    this.loadAlertPreferences();

    if (showMyAlertPreference) {
      const { userNotifications } = this.state;

      userNotifications.alert = {
        hasMoreNotifications: false,
        loading: false,
        notifications: []
      };

      this.setState({ userNotifications });
    }
  }

  componentWillUnmount() {
    this.removeKeyboardEvents();
  }

  onNotificationsUpdate = (userNotifications, enqueuedUserNotifications) => {
    const { showTransientNotifications, showNotificationPanel } = this.state;
    let transientNotifications = [];
    const unreadUserNotificationCount = _.reduce(
      userNotifications,
      (total, notificationStats) => (total + notificationStats.unread),
      0
    );

    if (!showNotificationPanel && showTransientNotifications) {
      transientNotifications = enqueuedUserNotifications;
      enqueuedUserNotifications = [];
    }

    this.setState({
      enqueuedUserNotifications,
      transientNotifications,
      unreadUserNotificationCount,
      userNotifications
    });
  }

  onSeeNewUserNotifications = (type) => {
    this.userNotificationAPI.seeNewNotifications(type);
  }

  onClearUserNotification = (notificationId) => {
    this.userNotificationAPI.deleteNotification(notificationId);
  }

  onToggleReadUserNotification = (notificationId, toggle) => {
    const { showTransientNotifications, showNotificationPanel } = this.state;
    const fromEnqueuedUserNotifications = !showNotificationPanel && showTransientNotifications;

    if (toggle) {
      this.userNotificationAPI.markNotificationAsRead(notificationId, fromEnqueuedUserNotifications);
    } else {
      this.userNotificationAPI.markNotificationAsUnRead(notificationId, fromEnqueuedUserNotifications);
    }
  }

  onShowTransientNotificationsChange = (toggle) => {
    this.setState({ showTransientNotifications: toggle });
  }

  getUnreadProductNotificationsCount = (notifications) => {
    return notifications.filter((notification) => {
      return _.isUndefined(notification.isUnread) || notification.isUnread == true;
    }).length;
  }

  addKeyboardEvents = () => {
    // add an event listener to hide when clicking somewhere
    window.addEventListener('mouseup', this.hidePanelOnOutsideClick);

    // add an event listened to hide when ESC is pressed
    window.addEventListener('keyup', this.hidePanelOnEscapeKeypress);
  }

  removeKeyboardEvents = () => {
    window.removeEventListener('mouseup', this.hidePanelOnOutsideClick);
    window.removeEventListener('keyup', this.hidePanelOnEscapeKeypress);
  }

  moveTransientNotificationIntoPanel = (notificationId) => {
    const { userNotifications, transientNotifications } = this.state;
    const notificationIndex = _.findIndex(transientNotifications, { id: notificationId });

    if (notificationIndex !== -1) {
      const notificationType = transientNotifications[notificationIndex].type;
      userNotifications[notificationType].notifications.unshift(transientNotifications[notificationIndex]);
      transientNotifications.splice(notificationIndex, 1);

      this.setState({
        transientNotifications,
        userNotifications
      });
    }
  }

  filterUserNotifications = (filterUserNotificationsBy) => {
    this.setState({ filterUserNotificationsBy });
  }

  clearAllUserNotifications = () => {
    this.userNotificationAPI.deleteAllNotifications();
    this.setState({ openClearAllUserNotificationsPrompt: false });
  }

  loadMoreUserNotifications = (type) => {
    this.userNotificationAPI.loadMoreNotifications(type);
  }

  toggleClearAllUserNotificationsPrompt = (toggle) => {
    this.setState({ openClearAllUserNotificationsPrompt: toggle });
  }

  toggleNotificationPanel = () => {
    const showNotificationPanel = !this.state.showNotificationPanel;
    const { showUserNotifications } = this.props.options;
    const { showTransientNotifications } = this.state;

    if (showUserNotifications && showTransientNotifications) {
      this.onSeeNewUserNotifications(DEFAULT_FILTER_TAB);
    }

    if (showNotificationPanel) {
      this.addKeyboardEvents();

      this.setState({ showNotificationPanel });
    } else {
      this.removeKeyboardEvents();

      this.setState({
        filterUserNotificationsBy: DEFAULT_FILTER_TAB,
        isSecondaryPanelOpen: false,
        openClearAllUserNotificationsPrompt: false,
        showNotificationPanel
      });
    }
  }

  hasUnreadNotifications = () => {
    const { unreadProductNotificationCount, userNotifications } = this.state;

    return unreadProductNotificationCount > 0 ||
      userNotifications.activity.notifications.length > 0 ||
      (!_.isUndefined(userNotifications.alert) && userNotifications.alert.notifications.length > 0);
  }

  hasUnreadProductNotifications = () => {
    return this.state.unreadProductNotificationCount > 0;
  }

  hasEnqueuedUserNotifications = (type) => {
    return _.some(this.state.enqueuedUserNotifications, { type });
  }

  hidePanelOnOutsideClick = (event) => {
    if (event.target &&
      event.target.closest &&
      !event.target.closest('#socrata-notifications-container')) {
      this.toggleNotificationPanel();
    }
  }

  hidePanelOnEscapeKeypress = (event) => {
    if (event.keyCode === ESCAPE) {
      this.toggleNotificationPanel();
    }
  }

  loadAlertPreferences = () => {
    const { inProductTransientNotificationsEnabled } = this.props.options;
    let { showTransientNotifications } = false;

    AlertPreferenceAPI.get().then((response) => {
      const settings = _.get(response, 'settings', {});

      showTransientNotifications = inProductTransientNotificationsEnabled && _.get(settings, 'in_product_transient[0].enable', false);

      this.setState({ showTransientNotifications });
    }).
    catch((error) => {
      this.setState({ showTransientNotifications });
    });
  }

  loadProductNotifications = () => {
    const { showUserNotifications } = this.props.options;

    if (showUserNotifications) {
      this.setState({ showProductNotificationsAsSecondaryPanel: true });
    }

    this.setState({ areProductNotificationsLoading: true });

    getProductNotifications((response) => {
      const { notifications, viewOlderLink } = response;

      if (notifications && viewOlderLink) {
        this.setState({
          areProductNotificationsLoading: false,
          productNotifications: notifications,
          unreadProductNotificationCount: this.getUnreadProductNotificationsCount(notifications),
          viewOlderLink: viewOlderLink
        });
      } else {
        this.setState({
          areProductNotificationsLoading: false,
          hasError: true,
          viewOlderLink: null
        });
      }
    });
  }

  markAllProductNotificationsAsRead = () => {
    if (this.hasUnreadProductNotifications()) {
      const readNotifications = this.state.productNotifications.map((notification) => ({
        ...notification,
        isUnread: false
      }));

      this.setState({ productNotifications: readNotifications, unreadProductNotificationCount: 0 });
      updateProductNotificationLastSeen(new Date());
    }
  }

  toggleProductNotificationsSecondaryPanel = () => {
    const isSecondaryPanelOpen = !this.state.isSecondaryPanelOpen;

    if (isSecondaryPanelOpen) {
      this.setState({
        isSecondaryPanelOpen,
        openClearAllUserNotificationsPrompt: false
      });
    } else {
      this.setState({ isSecondaryPanelOpen });
    }
  }

  renderSidebarOverlay = () => {
    const { showProductNotifications } = this.props.options;

    if (!showProductNotifications) {
      return (<span
        aria-hidden="true"
        className="sidebar-overlay"
        onClick={this.toggleNotificationPanel}></span>);
    }
  }

  renderNotificationPanel = () => {
    const { showNotificationPanel } = this.state;

    if (showNotificationPanel) {
      const {
        currentDomainFeatures,
        currentUserRole,
        inProductTransientNotificationsEnabled,
        isSuperAdmin,
        mapboxAccessToken,
        showMyAlertPreference,
        showProductNotifications,
        showUserNotifications
      } = this.props.options;
      const {
        areProductNotificationsLoading,
        filterUserNotificationsBy,
        hasError,
        isSecondaryPanelOpen,
        openClearAllUserNotificationsPrompt,
        productNotifications,
        showProductNotificationsAsSecondaryPanel,
        unreadProductNotificationCount,
        unreadUserNotificationCount,
        userNotifications,
        viewOlderLink
      } = this.state;

      return (
        <div className="notifications-panel-wrapper">
          {this.renderSidebarOverlay()}

          <NotificationList
            areProductNotificationsLoading={areProductNotificationsLoading}
            clearAllUserNotifications={this.clearAllUserNotifications}
            currentDomainFeatures={currentDomainFeatures}
            currentUserRole={currentUserRole}
            filterUserNotifications={this.filterUserNotifications}
            filterUserNotificationsBy={filterUserNotificationsBy}
            hasError={hasError}
            hasEnqueuedUserNotifications={this.hasEnqueuedUserNotifications}
            inProductTransientNotificationsEnabled={inProductTransientNotificationsEnabled}
            isSuperAdmin={isSuperAdmin}
            isSecondaryPanelOpen={isSecondaryPanelOpen}
            mapboxAccessToken={mapboxAccessToken}
            markAllProductNotificationsAsRead={this.markAllProductNotificationsAsRead}
            onClearUserNotification={this.onClearUserNotification}
            onLoadMoreUserNotifications={this.loadMoreUserNotifications}
            onSeeNewUserNotifications={this.onSeeNewUserNotifications}
            onShowTransientNotificationsChange={this.onShowTransientNotificationsChange}
            onToggleReadUserNotification={this.onToggleReadUserNotification}
            openClearAllUserNotificationsPrompt={openClearAllUserNotificationsPrompt}
            productNotifications={productNotifications}
            showMyAlertPreference={showMyAlertPreference}
            showProductNotifications={showProductNotifications}
            showProductNotificationsAsSecondaryPanel={showProductNotificationsAsSecondaryPanel}
            showUserNotifications={showUserNotifications}
            toggleClearAllUserNotificationsPrompt={this.toggleClearAllUserNotificationsPrompt}
            toggleNotificationPanel={this.toggleNotificationPanel}
            toggleProductNotificationsSecondaryPanel={this.toggleProductNotificationsSecondaryPanel}
            unreadProductNotificationCount={unreadProductNotificationCount}
            unreadUserNotificationCount={unreadUserNotificationCount}
            userNotifications={userNotifications}
            viewOlderLink={viewOlderLink} />
        </div>
      );
    }
  }

  renderTransientNotifications = () => {
    const { showTransientNotifications, showNotificationPanel, transientNotifications } = this.state;

    if (!showNotificationPanel && showTransientNotifications && !_.isEmpty(transientNotifications)) {
      return (
        <TransientNotifications
          onClearUserNotification={this.onClearUserNotification}
          onToggleReadUserNotification={this.onToggleReadUserNotification}
          moveTransientNotificationIntoPanel={this.moveTransientNotificationIntoPanel}
          transientNotifications={transientNotifications} />
      );
    }
  }

  render() {
    return (
      <div styleName="container">
        <div id="socrata-notifications-container">
          <Bell
            hasUnreadNotifications={this.hasUnreadNotifications()}
            toggleNotificationPanel={this.toggleNotificationPanel} />
          {this.renderTransientNotifications()}
          {this.renderNotificationPanel()}
        </div>
      </div>
    );
  }
}

Notifications.propTypes = {
  options: PropTypes.shape({
    currentUserRole: PropTypes.string,
    inProductTransientNotificationsEnabled: PropTypes.bool.isRequired,
    isSuperAdmin: PropTypes.bool.isRequired,
    showMyAlertPreference: PropTypes.bool,
    showProductNotifications: PropTypes.bool.isRequired,
    showUserNotifications: PropTypes.bool.isRequired
  }).isRequired
};

Notifications.defaultProps = {
  options: {
    inProductTransientNotificationsEnabled: false,
    showMyAlertPreference: false
  }
};

export default connectLocalization(cssModules(Notifications, styles));
