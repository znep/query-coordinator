import 'socrata-utils';
import _ from 'lodash';
import classNames from 'classnames';
import React, { PropTypes } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { handleKeyPress } from '../lib/a11yHelpers';
import { publishView, clearViewPublishError } from '../actions/view';

export var PublishNotice = React.createClass({
  propTypes: {
    onClickPublish: PropTypes.func,
    onDismissError: PropTypes.func,
    view: PropTypes.object.isRequired
  },

  renderPublishErrorAlert: function() {
    var { view, onDismissError } = this.props;

    if (!view.hasPublishingError) {
      return null;
    }

    return (
      <div className="alert error alert-full-width-top publish-error">
        <div className="alert-container">
          <span
            className="icon-close-2 alert-dismiss"
            role="alert"
            tabIndex="0"
            aria-label="dismiss"
            onKeyDown={handleKeyPress(onDismissError, true)}
            onClick={onDismissError} />
          <span dangerouslySetInnerHTML={{ __html: I18n.publish_error }} />
        </div>
      </div>
    );
  },

  renderPublishAlert: function() {
    var { view, onClickPublish } = this.props;

    var message = I18n.publish_notice.format({ url: view.gridUrl });

    var buttonClassName = classNames('btn btn-primary btn-sm');
    var buttonOnClick = null;
    var buttonContents;

    if (view.hasPublishingSuccess) {
      buttonClassName = classNames(buttonClassName, 'btn-success');
      buttonContents = `${I18n.published}!`;
    } else if (view.isPublishing) {
      buttonClassName = classNames(buttonClassName, 'btn-busy');
      buttonContents = <div className="spinner-default spinner-btn-primary" />;
    } else {
      buttonOnClick = onClickPublish;
      buttonContents = I18n.publish;
    }

    return (
      <div className="alert warning alert-full-width-top publish-notice">
        <div className="alert-container">
          <span dangerouslySetInnerHTML={{ __html: message }} />

          <button className={buttonClassName} onClick={buttonOnClick}>
            {buttonContents}
          </button>
        </div>
      </div>
    );
  },

  render: function() {
    var { view } = this.props;

    if (!view.isUnpublished) {
      return null;
    }

    return (
      <div>
        {this.renderPublishAlert()}
        {this.renderPublishErrorAlert()}
      </div>
    );
  }
});

function mapStateToProps(state) {
  return _.pick(state, 'view');
}

function mapDispatchToProps(dispatch) {
  return bindActionCreators({
    onClickPublish: publishView,
    onDismissError: clearViewPublishError
  }, dispatch);
}

export default connect(mapStateToProps, mapDispatchToProps)(PublishNotice);
