import 'common/js_utils'; // Side effect: Set string.format, which is used by this file.
import _ from 'lodash';
import classNames from 'classnames';
import React, { PropTypes, Component } from 'react';
import { bindActionCreators } from 'redux';
import { connect } from 'react-redux';
import { handleKeyPress } from '../../common/a11yHelpers';
import { userHasRight } from '../../common/user';
import * as Rights from '../../common/rights';
import { publishView, clearViewPublishError } from '../actions/view';
import { localizeLink } from '../../common/locale';

// TODO: Make an example page for this component.
export class PublishNotice extends Component {
  renderPublishErrorAlert() {
    const { view, onDismissError } = this.props;

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
  }

  renderPublishAlert() {
    const { view, onClickPublish } = this.props;
    const message = I18n.publish_notice.format({ url: localizeLink(view.gridUrl) });
    let flyout = null;
    let buttonContents = I18n.publish;
    const buttonProps = {
      className: classNames('btn btn-primary btn-sm'),
      onClick: onClickPublish,
      'data-flyout': null
    };

    if (!view.canPublish) {
      buttonProps.className = classNames(buttonProps.className, 'btn-disabled');
      buttonProps.onClick = null;
      buttonProps['data-flyout'] = 'publish-flyout';

      flyout = (
        <div id="publish-flyout" className="flyout flyout-hidden">
          <section className="flyout-content">
            <p>{I18n.publish_geocoding_message}</p>
          </section>
          <footer className="flyout-footer" />
        </div>
      );
    } else if (view.hasPublishingSuccess) {
      buttonProps.className = classNames(buttonProps.className, 'btn-success');
      buttonContents = `${I18n.published}!`;
    } else if (view.isPublishing) {
      buttonProps.className = classNames(buttonProps.className, 'btn-busy');
      buttonProps.onClick = null;
      buttonContents = <div className="spinner-default spinner-btn-primary" />;
    }

    const button = userHasRight(Rights.edit_others_datasets) ?
      <button {...buttonProps}>{buttonContents}</button> :
      null;

    return (
      <div className="alert warning alert-full-width-top publish-notice">
        <div className="alert-container">
          <span className="message" dangerouslySetInnerHTML={{ __html: message }} />

          {button}
          {flyout}
        </div>
      </div>
    );
  }

  render() {
    const { view } = this.props;

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
}

PublishNotice.propTypes = {
  onClickPublish: PropTypes.func,
  onDismissError: PropTypes.func,
  view: PropTypes.object.isRequired
};

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
