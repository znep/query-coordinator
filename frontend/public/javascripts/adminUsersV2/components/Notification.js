import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { SocrataIcon } from 'common/components';
import SocrataButton from 'common/components/SocrataButton';
import cx from 'classnames';
import ConditionTransitionMotion from 'common/components/ConditionTransitionMotion';
import { spring } from 'react-motion';
import { connect } from 'react-redux';
import connectLocalization from 'common/i18n/components/connectLocalization';
import _ from 'lodash';

class NotificationBox extends Component {
  render() {
    const { content, onDismiss, style, type, canDismiss = false } = this.props;
    const className = cx(
      'alert',
      {
        [type]: true
      },
      this.props.className
    );
    const htmlContent = {
      __html: content
    };
    return (
      <div className="socrata-notification">
        <div className={className} style={style}>
          <span dangerouslySetInnerHTML={htmlContent} />
          {canDismiss ? (
            <SocrataButton buttonType="transparent" onClick={() => onDismiss()}>
              <SocrataIcon name="close-2" />
            </SocrataButton>
          ) : null}
        </div>
      </div>
    );
  }
}

NotificationBox.defaultProps = {
  canDismiss: false,
  onDismiss: () => {}
};

NotificationBox.propTypes = {
  content: PropTypes.string,
  onDismiss: PropTypes.func,
  type: PropTypes.oneOf(['warning', 'default', 'info', 'success', 'error']),
  canDismiss: PropTypes.bool
};

export default class Notification extends Component {
  render() {
    const { showNotification, ...props } = this.props;
    return (
      <ConditionTransitionMotion
        condition={showNotification}
        willEnter={() => ({ opacity: 0, right: -16 })}
        willLeave={() => ({ opacity: spring(0), right: spring(-16) })}
        style={{ opacity: spring(1), right: spring(16) }}>
        {style => <NotificationBox style={style} {...props} />}
      </ConditionTransitionMotion>
    );
  }
}

const mapStateToProps = ({ ui: { notificationContent, notificationType, showNotification } }, { I18n }) => {
  const content = _.has(notificationContent, 'translationKey')
    ? I18n.translate(notificationContent.translationKey, notificationContent)
    : notificationContent;

  return {
    content,
    type: notificationType,
    showNotification
  };
};

export const LocalizedNotification = connectLocalization(connect(mapStateToProps)(Notification));

export const types = {
  DEFAULT: 'default',
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};
