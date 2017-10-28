import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import { userHasRight } from '../../common/user';
import * as Rights from '../../common/rights';
import { localizeLink } from 'common/locale';
import { Flannel, FlannelHeader, FlannelContent } from 'common/components/Flannel';

export default class ShareFlannel extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      flannelOpen: props.flannelOpen
    };

    _.bindAll(this, ['closeFlannel', 'openFlannel', 'onClickOption']);
  }

  closeFlannel() {
    this.setState({ flannelOpen: false });
  }

  openFlannel() {
    this.setState({ flannelOpen: true });
  }

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

  onClickOption(event) {
    const { onClickShareOption } = this.props;

    onClickShareOption(event.currentTarget.dataset.shareOption);
  }

  renderFlannel() {
    const { view } = this.props;

    const flannelProps = {
      id: 'share-flannel',
      className: 'share-flannel',
      title: I18n.share.title.replace('%{dataset_title}', view.name),
      target: () => this.targetElement,
      onDismiss: this.closeFlannel
    };

    const flyoutHeaderProps = {
      title: I18n.share.title.replace('%{dataset_title}', view.name),
      onDismiss: this.closeFlannel
    };

    return (
      <Flannel {...flannelProps}>
        <FlannelHeader {...flyoutHeaderProps} />
        <FlannelContent>
          <div>
            {I18n.share.description.replace('%{dataset_title}', view.name)}
          </div>

          {this.renderPrivateNotice()}

          <div className="section">
            <div className="facebook">
              <a
                href={view.facebookShareUrl}
                data-share-option="Facebook"
                target="_blank"
                onClick={this.onClickOption}>
                <span className="icon-facebook" />
                {I18n.share.facebook}
              </a>
            </div>

            <div className="twitter">
              <a
                href={view.twitterShareUrl}
                data-share-option="Twitter"
                target="_blank"
                onClick={this.onClickOption}>
                <span className="icon-twitter" />
                {I18n.share.twitter}
              </a>
            </div>

            <div className="email">
              <a href={view.emailShareUrl} data-share-option="Email" onClick={this.onClickOption}>
                <span className="icon-email" />
                {I18n.share.email}
              </a>
            </div>
          </div>
        </FlannelContent>
      </Flannel>
    );
  }

  renderTarget() {
    const targetProps = {
      className: 'btn btn-simple btn-sm',
      'aria-hidden': true,
      ref: ref => this.targetElement = ref,
      onClick: this.openFlannel
    };

    return (
      <span {...targetProps}>
        {I18n.action_buttons.share}
      </span>
    );
  }

  render() {
    return (
      <div className="btn-container">
        {this.renderTarget()}
        {this.state.flannelOpen && this.renderFlannel()}
      </div>
    );
  }
}

ShareFlannel.defaultProps = {
  flannelOpen: false
};

ShareFlannel.propTypes = {
  onClickShareOption: PropTypes.func.isRequired,
  view: PropTypes.object.isRequired,
  flannelOpen: PropTypes.bool
};