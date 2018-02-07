import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import _ from 'lodash';

import connectLocalization from 'common/i18n/components/connectLocalization';

import { getProductNotifications, updateProductNotificationLastSeen } from 'common/notifications/api/ProductNotificationAPI';
import NotificationList from 'common/notifications/components/NotificationList/NotificationList';
import UserNotificationAPI from 'common/notifications/api/UserNotificationAPI';
import AlertPreferenceAPI from 'common/notifications/api/AlertPreferenceAPI';
import Bell from 'common/notifications/components/Bell/Bell';
import TransientNotifications from 'common/notifications/components/UserNotifications/TransientNotifications';
import { DEFAULT_FILTER_TAB } from 'common/notifications/constants';
import styles from './notifications.module.scss';

class Notifications extends Component {
  constructor(props) {
    super(props);

    this.state = {
      areNotificationsLoading: false,
      filterUserNotificationsBy: DEFAULT_FILTER_TAB,
      hasError: false,
      productNotifications: [],
      showNotificationPanel: false,
      showProductNotificationsAsSecondaryPanel: false,
      showTransientNotifications: false,
      openClearAllUserNotificationsPrompt: false,
      unreadProductNotificationCount: 0,
      unreadUserNotificationCount: 0,
      userNotifications: [],
      transientNotifications: [],
      enqueuedUserNotifications: [],
      isSecondaryPanelOpen: false,
      hasMoreNotifications: false,
      hasEnqueuedUserNotifications: false
    };

    if (props.options.showUserNotifications && props.userid) {
      this.userNotificationAPI = new UserNotificationAPI(
        props.userid,
        this.onNotificationsUpdate.bind(this),
        { developmentMode: _.get(props, 'options.developmentMode', false) }
      );
    }

    _.bindAll(this,
      'filterUserNotifications',
      'onToggleReadUserNotification',
      'toggleClearAllUserNotificationsPrompt',
      'toggleProductNotificationsSecondaryPanel',
      'addKeyboardEvents',
      'removeKeyboardEvents',
      'hidePanelOnOutsideClick',
      'hidePanelOnEscapeKeypress',
      'toggleNotificationPanel',
      'hasUnreadNotifications',
      'hasUnreadProductNotifications',
      'getUnreadProductNotificationsCount',
      'markAllProductNotificationsAsRead',
      'clearAllUserNotifications',
      'onClearUserNotification',
      'renderNotificationPanel',
      'onSeeNewUserNotifications',
      'onLoadMoreUserNotifications',
      'moveTransientNotificationIntoPanel',
      'onShowTransientNotificationsChange'
    );
  }

  componentWillMount() {
    const {
      showProductNotifications,
      showUserNotifications,
      inProductTransientNotificationsEnabled
    } = this.props.options;
    const { I18n } = this.props;

    if (showProductNotifications) {
      if (showUserNotifications) {
        this.setState({ showProductNotificationsAsSecondaryPanel: true });
      }

      this.setState({ areNotificationsLoading: true });

      getProductNotifications((response) => {
        if (response.notifications && response.viewOlderLink) {
          this.setState({
            productNotifications: response.notifications,
            viewOlderLink: response.viewOlderLink || null,
            areNotificationsLoading: false,
            unreadProductNotificationCount: this.getUnreadProductNotificationsCount(response.notifications)
          });
        } else {
          this.setState({
            hasError: true,
            areNotificationsLoading: false
          });
        }
      });
    }

    if (inProductTransientNotificationsEnabled) {
      let { showTransientNotifications } = this.state;

      AlertPreferenceAPI.get().then((response) => {
        const settings = _.get(response, 'settings', {});

        showTransientNotifications = _.get(settings, 'in_product_transient[0].enable', false);
        this.setState({ showTransientNotifications });
      }).
      catch((error) => {
        showTransientNotifications = false;
        this.setState({ showTransientNotifications });
      });
    }
  }

  componentWillUnmount() {
    this.removeKeyboardEvents();
  }

  addKeyboardEvents() { // eslint-disable-line react/sort-comp
    // add an event listener to hide when clicking somewhere
    window.addEventListener('mouseup', this.hidePanelOnOutsideClick);

    // add an event listened to hide when ESC is pressed
    window.addEventListener('keyup', this.hidePanelOnEscapeKeypress);
  }

  removeKeyboardEvents() {
    window.removeEventListener('mouseup', this.hidePanelOnOutsideClick);
    window.removeEventListener('keyup', this.hidePanelOnEscapeKeypress);
  }

  hidePanelOnOutsideClick(event) {
    if (event.target &&
      event.target.closest &&
      !event.target.closest('#socrata-notifications-container')) {
      this.toggleNotificationPanel();
    }
  }

  hidePanelOnEscapeKeypress(event) {
    if (event.keyCode === 27) {
      this.toggleNotificationPanel();
    }
  }

  onNotificationsUpdate(userNotifications, enqueuedUserNotifications, hasMoreNotifications, unreadUserNotificationCount) {
    const { showTransientNotifications, showNotificationPanel } = this.state;
    let transientNotifications = [];
    let hasEnqueuedUserNotifications = false;

    if (!showNotificationPanel && showTransientNotifications) {
      transientNotifications = enqueuedUserNotifications;
      enqueuedUserNotifications = [];
    } else {
      hasEnqueuedUserNotifications = !_.isEmpty(enqueuedUserNotifications);
    }

    this.setState({
      userNotifications,
      enqueuedUserNotifications,
      unreadUserNotificationCount,
      hasMoreNotifications,
      hasEnqueuedUserNotifications,
      transientNotifications
    });
  }

  moveTransientNotificationIntoPanel(notificationId) {
    const { userNotifications, transientNotifications } = this.state;
    const notificationIndex = transientNotifications.findIndex((n) => _.isEqual(n.id, notificationId));

    if (notificationIndex !== -1) {
      userNotifications.unshift(transientNotifications[notificationIndex]);
      transientNotifications.splice(notificationIndex, 1);

      this.setState({
        userNotifications,
        transientNotifications
      });
    }
  }

  filterUserNotifications(filterUserNotificationsBy) {
    this.setState({ filterUserNotificationsBy });
  }

  clearAllUserNotifications() {
    this.userNotificationAPI.deleteAllNotifications();
    this.setState({ openClearAllUserNotificationsPrompt: false });
  }

  onLoadMoreUserNotifications() {
    this.userNotificationAPI.loadMoreNotifications();
  }

  onSeeNewUserNotifications() {
    this.userNotificationAPI.seeNewNotifications();
  }

  toggleClearAllUserNotificationsPrompt(toggle) {
    this.setState({ openClearAllUserNotificationsPrompt: toggle });
  }

  onClearUserNotification(notificationId) {
    this.userNotificationAPI.deleteNotification(notificationId);
  }

  onToggleReadUserNotification(notificationId, toggle) {
    const { showTransientNotifications, showNotificationPanel } = this.state;
    const fromEnqueuedUserNotifications = !showNotificationPanel && showTransientNotifications;

    if (toggle) {
      this.userNotificationAPI.markNotificationAsRead(notificationId, fromEnqueuedUserNotifications);
    } else {
      this.userNotificationAPI.markNotificationAsUnRead(notificationId, fromEnqueuedUserNotifications);
    }
  }

  onShowTransientNotificationsChange(toggle) {
    this.setState({ showTransientNotifications: toggle });
  }

  toggleNotificationPanel() {
    const showNotificationPanel = !this.state.showNotificationPanel;
    const { showTransientNotifications } = this.state;

    if (showTransientNotifications) {
      this.onSeeNewUserNotifications();
    }

    if (showNotificationPanel) {
      this.addKeyboardEvents();

      this.setState({ showNotificationPanel });
    } else {
      this.removeKeyboardEvents();

      this.setState({
        showNotificationPanel,
        openClearAllUserNotificationsPrompt: false,
        isSecondaryPanelOpen: false,
        filterUserNotificationsBy: DEFAULT_FILTER_TAB
      });
    }
  }

  hasUnreadNotifications() {
    return (this.state.unreadProductNotificationCount + this.state.unreadUserNotificationCount) > 0;
  }

  hasUnreadProductNotifications() {
    return this.state.unreadProductNotificationCount > 0;
  }

  getUnreadProductNotificationsCount(notifications) {
    return notifications.filter((notification) => {
      return _.isUndefined(notification.isUnread) || notification.isUnread == true;
    }).length;
  }

  markAllProductNotificationsAsRead() {
    if (this.hasUnreadProductNotifications()) {
      const readNotifications = this.state.productNotifications.map((notification) => ({
        ...notification,
        isUnread: false
      }));

      this.setState({ productNotifications: readNotifications, unreadProductNotificationCount: 0 });
      updateProductNotificationLastSeen(new Date());
    }
  }

  toggleProductNotificationsSecondaryPanel() {
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

  renderSidebarOverlay() {
    const { showProductNotifications } = this.props.options;

    if (!showProductNotifications) {
      return (<span
        className="sidebar-overlay"
        aria-hidden="true"
        onClick={this.toggleNotificationPanel}></span>);
    }
  }

  renderNotificationPanel() {
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
        areNotificationsLoading,
        filterUserNotificationsBy,
        hasError,
        hasMoreNotifications,
        hasEnqueuedUserNotifications,
        isSecondaryPanelOpen,
        openClearAllUserNotificationsPrompt,
        productNotifications,
        userNotifications,
        showProductNotificationsAsSecondaryPanel,
        unreadProductNotificationCount,
        unreadUserNotificationCount,
        viewOlderLink
      } = this.state;

      return (
        <div className="notifications-panel-wrapper">
          {this.renderSidebarOverlay()}

          <NotificationList
            areNotificationsLoading={areNotificationsLoading}
            clearAllUserNotifications={this.clearAllUserNotifications}
            currentUserRole={currentUserRole}
            filterUserNotifications={this.filterUserNotifications}
            filterUserNotificationsBy={filterUserNotificationsBy}
            hasError={hasError}
            hasMoreNotifications={hasMoreNotifications}
            hasEnqueuedUserNotifications={hasEnqueuedUserNotifications}
            isSuperAdmin={isSuperAdmin}
            isSecondaryPanelOpen={isSecondaryPanelOpen}
            markAllProductNotificationsAsRead={this.markAllProductNotificationsAsRead}
            onClearUserNotification={this.onClearUserNotification}
            onLoadMoreUserNotifications={this.onLoadMoreUserNotifications}
            onSeeNewUserNotifications={this.onSeeNewUserNotifications}
            onToggleReadUserNotification={this.onToggleReadUserNotification}
            openClearAllUserNotificationsPrompt={openClearAllUserNotificationsPrompt}
            productNotifications={productNotifications}
            showProductNotifications={showProductNotifications}
            showProductNotificationsAsSecondaryPanel={showProductNotificationsAsSecondaryPanel}
            showUserNotifications={showUserNotifications}
            toggleClearAllUserNotificationsPrompt={this.toggleClearAllUserNotificationsPrompt}
            toggleNotificationPanel={this.toggleNotificationPanel}
            toggleProductNotificationsSecondaryPanel={this.toggleProductNotificationsSecondaryPanel}
            userNotifications={userNotifications}
            unreadProductNotificationCount={unreadProductNotificationCount}
            unreadUserNotificationCount={unreadUserNotificationCount}
            currentDomainFeatures={currentDomainFeatures}
            showMyAlertPreference={showMyAlertPreference}
            inProductTransientNotificationsEnabled={inProductTransientNotificationsEnabled}
            onShowTransientNotificationsChange={this.onShowTransientNotificationsChange}
            mapboxAccessToken={mapboxAccessToken}
            viewOlderLink={viewOlderLink} />
        </div>
      );
    }
  }

  renderTransientNotifications() {
    const { showTransientNotifications, showNotificationPanel, transientNotifications } = this.state;

    if (!showNotificationPanel && showTransientNotifications && !_.isEmpty(transientNotifications)) {
      return (
        <TransientNotifications
          transientNotifications={transientNotifications}
          onClearUserNotification={this.onClearUserNotification}
          moveTransientNotificationIntoPanel={this.moveTransientNotificationIntoPanel}
          onToggleReadUserNotification={this.onToggleReadUserNotification} />
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
    isSuperAdmin: PropTypes.bool.isRequired,
    showProductNotifications: PropTypes.bool.isRequired,
    showMyAlertPreference: PropTypes.bool,
    inProductTransientNotificationsEnabled: PropTypes.bool.isRequired,
    showUserNotifications: PropTypes.bool.isRequired
  }).isRequired
};

Notifications.defaultProps = {
  options: {
    showMyAlertPreference: false,
    inProductTransientNotificationsEnabled: false
  }
};

export default connectLocalization(cssModules(Notifications, styles));
