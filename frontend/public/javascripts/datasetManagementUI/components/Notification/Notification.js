import PropTypes from 'prop-types';
import React, { Component } from 'react';
import _ from 'lodash';
import { CSSTransitionGroup } from 'react-transition-group';
import ProgressBar from 'datasetManagementUI/components/ProgressBar/ProgressBar';
import SocrataIcon from '../../../common/components/SocrataIcon';

class Notification extends Component {
  constructor() {
    super();

    this.state = {
      detailsOpen: true
    };

    _.bindAll(this, ['toggleDetails']);
  }

  toggleDetails() {
    this.setState({
      detailsOpen: !this.state.detailsOpen
    });
  }

  render() {
    const {
      status,
      progressBar,
      percentCompleted,
      message,
      children,
      removeNotification,
      id,
      isInfinite
    } = this.props;
    const { detailsOpen } = this.state;
    let className = ['notification'];
    let statusIcon;
    let statusMessage;

    switch (status) {
      case 'success':
        className = [...className, 'success'].join(' ');
        statusIcon = <SocrataIcon name="check" className="success-icon" />;
        statusMessage = (
          <span className="success-message">
            {I18n.notifications.success}
          </span>
        );
        break;
      case 'inProgress':
        className = [...className, 'in-progress'].join(' ');
        if (isInfinite) {
          statusIcon = <span className="progress-icon" />;
        } else {
          statusIcon = <span className="progress-icon">{`${Math.round(percentCompleted)}%`}</span>;
        }

        break;
      case 'error':
        className = [...className, 'error'].join(' ');
        statusIcon = <SocrataIcon name="warning" className="error-icon icon" />;
        statusMessage = (
          <a href="#" className="details-toggle" onClick={this.toggleDetails}>
            {detailsOpen ? I18n.notifications.hide_details : I18n.notifications.show_details}
          </a>
        );
        break;
      default:
        className = className.join(' ');
    }

    return (
      <div className={className}>
        <div className="cf">
          <span className="message-area">
            {message}
          </span>
          <span className="status-area">
            {statusMessage}
            {statusIcon}
          </span>
        </div>
        {progressBar &&
          <div className="progress-bar-container">
            <ProgressBar percent={percentCompleted || 0} type={status} className="progress-bar" />
          </div>}
        {children &&
          <CSSTransitionGroup
            transitionName={{
              enter: 'enter',
              enterActive: 'enter-active',
              leave: 'leave',
              leaveActive: 'leave-active'
            }}
            transitionEnterTimeout={500}
            transitionLeaveTimeout={500}>
            {detailsOpen &&
              <div>
                {children}
                <div className="btn-container">
                  <button className="btn btn-default btn-xs" onClick={() => removeNotification(id)}>
                    Dismiss
                  </button>
                  <a
                    target="_blank"
                    href="https://support.socrata.com"
                    className="contact-btn btn btn-primary btn-xs">
                    Contact Support
                  </a>
                </div>
              </div>}
          </CSSTransitionGroup>}
      </div>
    );
  }
}

Notification.propTypes = {
  status: PropTypes.string.isRequired,
  progressBar: PropTypes.bool,
  percentCompleted: PropTypes.number,
  children: PropTypes.object,
  message: PropTypes.object.isRequired,
  id: PropTypes.any.isRequired,
  removeNotification: PropTypes.func.isRequired,
  isInfinite: PropTypes.bool
};

export default Notification;
