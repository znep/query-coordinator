import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cx from 'classnames';
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
    canDismiss: PropTypes.bool,
    content: PropTypes.string,
    onDismiss: PropTypes.func.isRequired,
    positionTop: PropTypes.number,
    showNotification: PropTypes.bool,
    type: PropTypes.oneOf(['default', 'info', 'success', 'warning', 'error'])
  };

  static defaultProps = {
    canDismiss: false,
    content: '',
    positionTop: 35,
    showNotification: false,
    type: null
  }

  renderNotification = (style) => {
    const {
      canDismiss,
      content,
      onDismiss,
      type
    } = this.props;

    const className = cx(
      'alert',
      {
        [type]: true
      },
      this.props.className
    );

    return (
      <div className="socrata-toast-notification">
        <div className={className} style={style}>
          <span dangerouslySetInnerHTML={{ __html: content }} />
          {canDismiss
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
