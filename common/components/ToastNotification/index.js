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
    type: PropTypes.oneOf(['default', 'info', 'success', 'warning', 'error']),

    // Returns a set of props to pass to ConditionTransitionMotion.
    // This is optional - the default uses positionTop to make a default
    // animation.
    customTransition: PropTypes.object
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
      type,
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
    const { customTransition, positionTop, showNotification } = this.props;
    const defaultTransition = {
      willEnter: () => ({ opacity: 0, top: -positionTop }),
      willLeave: () => ({ opacity: spring(0), top: spring(-positionTop) }),
      style: { opacity: spring(1), top: spring(positionTop) }
    };
    return (
      <ConditionTransitionMotion
        condition={showNotification}
        {...(customTransition || defaultTransition)}>
        {style => this.renderNotification(style)}
      </ConditionTransitionMotion>
    );
  }
}
