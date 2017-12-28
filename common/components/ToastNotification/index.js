import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';
import { spring } from 'react-motion';

import { SocrataIcon } from '../SocrataIcon';
import ConditionTransitionMotion from '../ConditionTransitionMotion';

export const types = {
  DEFAULT: 'default',
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error'
};

export default class ToastNotification extends Component {
  static propTypes = {
    onDismiss: PropTypes.func,
    positionTop: PropTypes.number,
    showNotification: PropTypes.bool,
    type: PropTypes.oneOf(['default', 'info', 'success', 'warning', 'error'])
  };

  static defaultProps = {
    positionTop: 35,
    showNotification: false,
    type: null
  };

  renderNotification = (style) => {
    const {
      children,
      content,
      onDismiss,
      type
    } = this.props;

    const className = classNames(
      'alert',
      {
        [type]: true
      },
      this.props.className
    );

    return (
      <div className="socrata-toast-notification">
        <div className={className} style={style}>
          {children}
          {onDismiss
            ? (
            <button className="btn btn-transparent btn-dismiss" onClick={() => onDismiss()}>
              <SocrataIcon name="close-2" />
            </button>
              )
            : null}
        </div>
      </div>
    );
  }

  render() {
    const { positionTop, showNotification } = this.props;
    return (
      <ConditionTransitionMotion
        condition={showNotification}
        willEnter={() => ({ opacity: 0, top: -positionTop })}
        willLeave={() => ({ opacity: spring(0), top: spring(-positionTop) })}
        style={{ opacity: spring(1), top: spring(positionTop) }} >
        {style => this.renderNotification(style)}
      </ConditionTransitionMotion>
    );
  }
}
