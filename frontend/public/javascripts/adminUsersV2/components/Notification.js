import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { spring } from 'react-motion';

import { ToastNotification } from 'common/components';

import connectLocalization from 'common/i18n/components/connectLocalization';

const mapStateToProps = ({ ui: { notificationContent, notificationType, showNotification } }, { I18n }) => {
  const content = _.has(notificationContent, 'translationKey')
    ? I18n.translate(notificationContent.translationKey, notificationContent)
    : notificationContent;

  const customTransition = {
    willEnter: () => ({ opacity: 0, right: -16 }),
    willLeave: () => ({ opacity: spring(0), right: spring(-16) }),
    style: { opacity: spring(1), right: spring(16) }
  };

  return {
    children: <span dangerouslySetInnerHTML={{ __html: content }} />,
    customTransition,
    showNotification,
    type: notificationType
  };
};

export const LocalizedNotification = connectLocalization(connect(mapStateToProps)(ToastNotification));
