import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { connect } from 'react-redux';
import { emitMixpanelEvent } from '../actions/mixpanel';
import { userHasRight } from '../../common/user';
import * as Rights from '../../common/rights';
import { localizeLink } from 'common/locale';

import { Flyout, FlyoutHeader, FlyoutContent } from './Flyout';

class ShareFlyout extends PureComponent {

  renderPrivateNotice() {
    const { view } = this.props;

    if (view.isPrivate) {

      const manageLink = userHasRight(Rights.edit_others_datasets) ?
        <a href={`${localizeLink(view.gridUrl)}?pane=manage`}>
          {I18n.manage_prompt}
        </a> :
        null;

      return (
        <section>
          <div className="alert info">
            <span dangerouslySetInnerHTML={{ __html: I18n.share.visibility_alert_html }} />
            {' '}
            {manageLink}
          </div>
        </section>
      );
    } else {

      return null;
    }
  }

  render() {
    const { view, onClickOption } = this.props;

    const targetElement = (
      <span aria-hidden className="btn btn-simple btn-sm">
        {I18n.action_buttons.share}
      </span>
    );

    const flyoutProps = {
      position: 'left',
      trigger: 'click',
      className: 'btn-container share-flyout',
      targetElement
    };

    const headerProps = {
      title: I18n.share.title.replace('%{dataset_title}', view.name),
      description: I18n.share.description.replace('%{dataset_title}', view.name)
    };

    return (
      <Flyout {...flyoutProps}>
        <FlyoutHeader {...headerProps} />
        <FlyoutContent>
          {this.renderPrivateNotice()}

          <div className="section">
            <div className="facebook">
              <a
                href={view.facebookShareUrl}
                data-share-option="Facebook"
                target="_blank"
                onClick={onClickOption}>
                <span className="icon-facebook" />
                {I18n.share.facebook}
              </a>
            </div>

            <div className="twitter">
              <a
                href={view.twitterShareUrl}
                data-share-option="Twitter"
                target="_blank"
                onClick={onClickOption}>
                <span className="icon-twitter" />
                {I18n.share.twitter}
              </a>
            </div>

            <div className="email">
              <a href={view.emailShareUrl} data-share-option="Email" onClick={onClickOption}>
                <span className="icon-email" />
                {I18n.share.email}
              </a>
            </div>
          </div>
        </FlyoutContent>
      </Flyout>
    );
  }
}

ShareFlyout.propTypes = {
  onClickOption: PropTypes.func.isRequired,
  view: PropTypes.object.isRequired
};

function mapDispatchToProps(dispatch) {
  return {
    onClickOption(event) {
      const payload = {
        name: 'Shared Dataset',
        properties: {
          'Provider': event.currentTarget.dataset.shareOption
        }
      };

      dispatch(emitMixpanelEvent(payload));
    }
  };
}

export default connect(null, mapDispatchToProps)(ShareFlyout);
