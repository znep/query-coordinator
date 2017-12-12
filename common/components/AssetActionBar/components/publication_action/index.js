import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import I18n from 'common/i18n';
import { SocrataUid } from '../../lib/socrata_proptypes';
import SocrataIcon from 'common/components/SocrataIcon';
import EditButton from '../edit_button';

class PublicationAction extends React.Component {
  constructor(props) {
    super(props);

    this.i18n_scope = 'shared.components.asset_action_bar.publication_action';
    this.state = {
      moreActionsVisible: false
    };

    _.bindAll(this, [
      'showMoreActions', 'closeMoreActions'
    ]);
  }

  showMoreActions() {
    this.setState({ moreActionsVisible: true });
  }

  closeMoreActions() {
    this.setState({ moreActionsVisible: false });
  }

  // This function is called twice and isn't memoized.
  // If you add anything remotely complex, you'll want to add memoization, too.
  moreActionsAllowed() {
    const { allowedTo, publicationState, publishedViewUid } = this.props;

    return {
      // We're not including Revert for now as per ChristianH.
      revert: false, // publicationState === 'draft' && publishedViewUid,
      view: publishedViewUid,
      changeAudience: allowedTo.manage && publicationState === 'published'
    };
  }

  moreActionsExist() {
    return this.props.allowedTo.manage && _.some(this.moreActionsAllowed());
  }

  renderMoreActionButton() {
    return (
      <button className="btn btn-simple more-actions-button" onClick={this.showMoreActions}>
        <SocrataIcon name="waiting" />
      </button>
    );
  }

  renderMoreActions() {
    const currentlyAbleTo = this.moreActionsAllowed();
    const { publishedViewUid } = this.props;
    let actions = [];

    if (currentlyAbleTo.revert) {
      actions.push(<button className="btn btn-alternate-2" key="revert-action">
        {I18n.t('revert_published', { scope: this.i18n_scope })}
      </button>);
    }

    if (currentlyAbleTo.view) {
      actions.push(<a
        href={`/d/${publishedViewUid}`}
        className="btn btn-alternate-2"
        key="view-action">
        {I18n.t('view_published', { scope: this.i18n_scope })}
      </a>);
    }

    if (currentlyAbleTo.changeAudience) {
      actions.push(<button
        className="btn btn-alternate-2"
        key="change-audience-action">
        {I18n.t('change_audience', { scope: this.i18n_scope })}
      </button>);
    }

    return (
      <div>
        <div onClick={this.closeMoreActions} className="asset-action-bar-overlay" />
        <div className="more-actions">
          {actions}
        </div>
      </div>
    );
  }

  renderPrimaryActionButton() {
    const { currentViewUid, allowedTo, publicationState } = this.props;

    if (allowedTo.edit && publicationState === 'published') {
      return <EditButton currentViewUid={currentViewUid} />;
    }

    const actionText = I18n.t(`${publicationState}.primary_action_text`, {
      scope: this.i18n_scope
    });

    return (
      <button className="btn btn-primary btn-dark">
        {actionText}
      </button>
    );
  }

  render() {
    return (
      <div className="publication-action">
        {this.renderPrimaryActionButton()}
        {this.moreActionsExist() && this.renderMoreActionButton()}
        {this.state.moreActionsVisible && this.renderMoreActions()}
      </div>
    );
  }
}

PublicationAction.propTypes = {
  allowedTo: PropTypes.object.isRequired,
  currentViewUid: SocrataUid.isRequired,
  publicationState: PropTypes.oneOf(['draft', 'pending', 'published']).isRequired,
  publishedViewUid: SocrataUid
};

export default PublicationAction;
