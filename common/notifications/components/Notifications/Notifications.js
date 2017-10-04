import React, { Component } from 'react';
import PropTypes from 'prop-types';
import cssModules from 'react-css-modules';
import 'babel-polyfill-safe';
import _ from 'lodash';

import connectLocalization from 'common/i18n/components/connectLocalization';

import { getProductNotifications, updateProductNotificationLastSeen } from 'common/notifications/store/ProductNotificationStore';
import NotificationList from 'common/notifications/components/NotificationList/NotificationList';
import UserNotificationStore from 'common/notifications/store/UserNotificationStore';
import Bell from 'common/notifications/components/Bell/Bell';
import styles from './notifications.scss';

class Notifications extends Component {
  constructor(props) {
    super(props);

    const { I18n } = props;

    this.state = {
      areNotificationsLoading: false,
      filterUserNotificationsBy: I18n.t('filter_all_notifications_tab_text'),
      hasError: false,
      productNotifications: [],
      showNotificationPanel: false,
      showProductNotificationsAsSecondaryPanel: false,
      openClearAllUserNotificationsPrompt: false,
      unreadProductNotificationCount: 0,
      unreadUserNotificationCount: 0,
      userNotifications: [],
      isSecondaryPanelOpen: false
    }

    if (props.options.showUserNotifications && props.userid) {
      this.userNotificationStore = new UserNotificationStore(props.userid, this.onNotificationsUpdate.bind(this));
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
      'renderNotificationPanel'
    );
  }

  componentDidMount() {
    const {
      showProductNotifications,
      showUserNotifications
    } = this.props.options;
    const { I18n } = this.props;

    if (showProductNotifications) {
      if (showUserNotifications) {
        this.setState({showProductNotificationsAsSecondaryPanel: true});
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
  }

  componentWillUnmount() {
    this.removeKeyboardEvents();
  }

  addKeyboardEvents() {
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

  onNotificationsUpdate(notifications) {
    const unReadNotificationsCount = _.isEmpty(notifications) ? 0 : notifications.filter(notification => {
        return _.isUndefined(notification.read) || notification.read === false;
      }).length;

    this.setState({
      userNotifications: notifications,
      unreadUserNotificationCount: unReadNotificationsCount
    })
  }

  filterUserNotifications(filterUserNotificationsBy) {
    this.setState({filterUserNotificationsBy});
  }

  clearAllUserNotifications() {
    this.userNotificationStore.deleteAllNotifications();
    this.setState({ openClearAllUserNotificationsPrompt: false });
  }

  toggleClearAllUserNotificationsPrompt(toggle) {
    this.setState({ openClearAllUserNotificationsPrompt: toggle });
  }

  onClearUserNotification(notification_id) {
    this.userNotificationStore.deleteNotification(notification_id);
  }

  onToggleReadUserNotification(notification_id, toggle) {
    if (toggle) {
      this.userNotificationStore.markNotificationAsRead(notification_id);
    } else {
      this.userNotificationStore.markNotificationAsUnRead(notification_id);
    }
  }

  toggleNotificationPanel() {
    const showNotificationPanel = !this.state.showNotificationPanel;
    const { I18n } = this.props;
    const {
      lockScrollbar,
      scrollTop
    } = this.props.options;

    if (showNotificationPanel) {
      this.addKeyboardEvents();

      if (lockScrollbar) {
        document.querySelector('body').scrollTop = scrollTop;
        document.querySelector('body').style.overflow = 'hidden';
      }

      this.setState({showNotificationPanel});
    } else {
      this.removeKeyboardEvents();

      if (lockScrollbar) {
        document.querySelector('body').style.overflow = '';
      }

      this.setState({
        showNotificationPanel,
        openClearAllUserNotificationsPrompt: false,
        isSecondaryPanelOpen: false,
        filterUserNotificationsBy: I18n.t('filter_all_notifications_tab_text')
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
      this.setState({isSecondaryPanelOpen});
    }

  }

  renderSidebarOverlay() {
    const { showProductNotifications } = this.props.options;

    if (!showProductNotifications) {
      return <span className="sidebar-overlay"
        aria-hidden="true"
        onClick={this.toggleNotificationPanel}></span>;
    }
  }

  renderNotificationPanel() {
    const { showNotificationPanel } = this.state;

    if (showNotificationPanel) {
      const {
        showProductNotifications,
        showUserNotifications,
        currentUserRole,
        isAdmin
      } = this.props.options;
      const {
        areNotificationsLoading,
        filterUserNotificationsBy,
        hasError,
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
        <div className='notifications-panel-wrapper'>
          {this.renderSidebarOverlay()}

          <NotificationList
            areNotificationsLoading={areNotificationsLoading}
            clearAllUserNotifications={this.clearAllUserNotifications}
            currentUserRole={currentUserRole}
            filterUserNotifications={this.filterUserNotifications}
            filterUserNotificationsBy={filterUserNotificationsBy}
            hasError={hasError}
            isAdmin={isAdmin}
            isSecondaryPanelOpen={isSecondaryPanelOpen}
            markAllProductNotificationsAsRead={this.markAllProductNotificationsAsRead}
            onClearUserNotification={this.onClearUserNotification}
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
            viewOlderLink={viewOlderLink} />
        </div>
      );
    }
  }

  render() {
    const {
      unreadProductNotificationCount,
      unreadUserNotificationCount
    } = this.state;

    return (
      <div styleName='container'>
        <div id='socrata-notifications-container'>
          <Bell hasUnreadNotifications={this.hasUnreadNotifications()}
            toggleNotificationPanel={this.toggleNotificationPanel} />

          {this.renderNotificationPanel()}
        </div>
      </div>
    );
  }
}

Notifications.propTypes = {
  options: PropTypes.shape({
    currentUserRole: PropTypes.string,
    isAdmin: PropTypes.bool.isRequired,
    lockScrollbar: PropTypes.bool,
    scrollTop: PropTypes.number,
    showProductNotifications: PropTypes.bool.isRequired,
    showUserNotifications: PropTypes.bool.isRequired
  }).isRequired
};

Notifications.defaultProps = {
  options: {
    lockScrollbar: PropTypes.false,
    scrollTop: 0,
  }
};

export default connectLocalization(cssModules(Notifications, styles));
