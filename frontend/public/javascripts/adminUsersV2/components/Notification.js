import React, { Component } from 'react';
import { connect as fullConnect, I18nPropType } from '../utils';
import { spring } from 'react-motion';
import ToastNotification from 'common/components/ToastNotification';
import * as Selectors from '../selectors';
import has from 'lodash/has';

export class Notification extends Component {
  static propTypes = {
    I18n: I18nPropType.isRequired,
    ...ToastNotification.propTypes
  };
  static defaultProps = {
    onDismiss: () => {}
  };
  render() {
    return (
      <ToastNotification {...this.props} />
    );
  }
}

const mapStateToProps = (state, { I18n }) => {
  const notificationContent = Selectors.getNotificationContent(state);
  const children = has(notificationContent, 'translationKey')
    ? I18n.t(notificationContent.translationKey, notificationContent)
    : notificationContent;

  const customTransition = {
    willEnter: () => ({ opacity: 0, right: -16 }),
    willLeave: () => ({ opacity: spring(0), right: spring(-16) }),
    style: { opacity: spring(1), right: spring(16) }
  };

  return {
    children,
    customTransition,
    showNotification: Selectors.getShowNotification(state),
    type: Selectors.getNotificationType(state)
  };
};

export { types } from 'common/components/ToastNotification';
export default fullConnect(mapStateToProps)(Notification);
