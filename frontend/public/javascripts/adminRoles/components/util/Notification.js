import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { SocrataIcon } from 'common/components';
import SocrataButton from './SocrataButton';
import cssModules from 'react-css-modules';
import styles from './socrata-notification.scss';
import cx from 'classnames';
import ConditionTransitionMotion from '../util/ConditionTransitionMotion';
import { spring } from 'react-motion';

class UnstyledNotification extends Component {
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
      <div styleName="notification">
        <div className={className} style={style}>
          <span dangerouslySetInnerHTML={htmlContent} />
          {canDismiss
            ? <SocrataButton buttonType="transparent" onClick={() => onDismiss()}>
                <SocrataIcon name="close-2" />
              </SocrataButton>
            : null}
        </div>
      </div>
    );
  }
}

UnstyledNotification.propTypes = {
  content: PropTypes.string,
  onDismiss: PropTypes.func.isRequired,
  type: PropTypes.oneOf(['warning', 'default', 'info', 'success', 'error']),
  canDismiss: PropTypes.bool
};

const StyledNotification = cssModules(UnstyledNotification, styles);

export default class Notification extends Component {
  render() {
    const { showNotification, ...props } = this.props;
    return (
      <ConditionTransitionMotion
        condition={showNotification}
        willEnter={() => ({ opacity: 0, right: -16 })}
        willLeave={() => ({ opacity: spring(0), right: spring(-16) })}
        style={{ opacity: spring(1), right: spring(16) }}
      >
        {style => <StyledNotification style={style} {...props} />}
      </ConditionTransitionMotion>
    );
  }
}

export const types = {
  DEFAULT: 'default',
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};
