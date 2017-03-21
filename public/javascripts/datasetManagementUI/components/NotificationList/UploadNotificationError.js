import React, { PropTypes, Component } from 'react';
import { removeNotification } from '../../actions/notifications';
import ProgressBar from '../ProgressBar';
import _ from 'lodash';
import ReactCSSTransitionGroup from 'react-addons-css-transition-group';

export function makeErrorMsg(filename) {
  return {
    title: I18n.progress_items.connection_error_title,
    body: [
      { __html: I18n.progress_items.connection_error_body_0.format(filename) },
      { __html: I18n.progress_items.connection_error_body_1 }
    ]
  };
}

class UploadNotificationError extends Component { //  eslint-disable-line react/prefer-es6-class
  constructor() {
    super();

    this.state = {
      detailsOpen: false
    };

    _.bindAll(this, ['toggleDetails']);
  }

  toggleDetails() {
    this.setState({
      detailsOpen: !this.state.detailsOpen
    });
  }

  render() {
    const { upload, notification, dispatch } = this.props;
    const { detailsOpen } = this.state;
    const errorMsg = makeErrorMsg(`<span class="filename">${upload.filename}</span>`);

    return (
      <div className="dsmui-notification error">
        <span className="message">{I18n.progress_items.upload_failed}</span>
        <span className="error-details">
          <a
            href="#"
            className="details-toggle"
            onClick={this.toggleDetails}>
              {detailsOpen ? I18n.progress_items.hide_details : I18n.progress_items.show_details}
          </a>
          <span className="icon socrata-icon-warning"></span>
        </span>
        <div className="upload-progress-bar">
          <ProgressBar percent={upload.__status__.percentCompleted || 0} />
        </div>
        <ReactCSSTransitionGroup
          transitionName="dsmui-error-notification-transition"
          transitionEnterTimeout={500}
          transitionLeaveTimeout={500}>
          {detailsOpen &&
            <div key={errorMsg.title}>
              <div className="msg-container">
                <h6>{errorMsg.title}</h6>
                {errorMsg.body.map((par, idx) => <p key={idx} dangerouslySetInnerHTML={par}></p>)}
              </div>
              <div className="btn-container">
                <button
                  className="btn btn-default btn-xs"
                  onClick={() => dispatch(removeNotification(notification))}>
                  Dismiss
                </button>
                <a className="btn btn-primary btn-xs" target="_blank" href="https://support.socrata.com">
                  Contact Support
                </a>
              </div>
            </div>
          }
        </ReactCSSTransitionGroup>
      </div>
    );
  }
}

UploadNotificationError.propTypes = {
  upload: PropTypes.object.isRequired,
  notification: PropTypes.object,
  dispatch: PropTypes.func.isRequired
};

export default UploadNotificationError;
