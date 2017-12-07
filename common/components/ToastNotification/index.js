import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { SocrataIcon } from '../SocrataIcon';
import cx from 'classnames';
import ConditionTransitionMotion from '../ConditionTransitionMotion';
import { spring } from 'react-motion';

export const types = {
  DEFAULT: 'default',
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

export default class Notification extends Component {
  static propTypes = {
    canDismiss: PropTypes.bool,
    content: PropTypes.string,
    onDismiss: PropTypes.func.isRequired,
    showNotification: PropTypes.bool,
    type: PropTypes.oneOf(['default', 'info', 'success', 'warning', 'error'])
  };

  renderNotification = (style) => {
    const { content, onDismiss, type, canDismiss = false } = this.props;
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
      <div className="socrata-toast-notification">
        <div className={className} style={style}>
          <span dangerouslySetInnerHTML={htmlContent} />
          {canDismiss
            ? (
            <button className="btn btn-transparent" onClick={() => onDismiss()}>
              <SocrataIcon name="close-2" />
            </button>
              )
            : null}
        </div>
      </div>
    );
  }

  render() {
    const { showNotification } = this.props;
    return (
      <ConditionTransitionMotion
        condition={showNotification}
        willEnter={() => ({ opacity: 0, right: -16 })}
        willLeave={() => ({ opacity: spring(0), right: spring(-16) })}
        style={{ opacity: spring(1), right: spring(16) }} >
        {style => this.renderNotification(style)}
      </ConditionTransitionMotion>
    );
  }
}
