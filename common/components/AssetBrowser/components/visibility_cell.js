import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';

export class VisibilityCell extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'getTranslation', 'isOpen', 'isPrivate', 'isPrivateAndSharedToCurrentUser', 'isHidden',
      'isHiddenAndRejected', 'isHiddenAndAwaitingApproval', 'renderVisibilityTitle',
      'renderVisibilityDescription');
  }

  getTranslation(key) {
    return I18n.t(`shared.asset_browser.result_list_table.visibility_values.${key}`);
  }

  isOpen() {
    return this.props.visibleToAnonymous;
  }

  isPrivate() {
    return !this.props.isPublic;
  }

  isPrivateAndSharedToCurrentUser() {
    const currentUserId = _.get(window, 'serverConfig.currentUser.id');

    if (!this.isPrivate() || !currentUserId) {
      return false;
    }

    const grantsUserIds = _.reduce(this.props.grants, (result, grant) => {
      result.push(grant.user_id);
      return result;
    }, []);

    return grantsUserIds.indexOf(currentUserId) !== -1;
  }

  isHidden() {
    const {
      isExplicitlyHidden,
      isModerationApproved,
      isPublished,
      isRoutingApproved
    } = this.props;

    return (
      isExplicitlyHidden || !isModerationApproved || !isPublished || !isRoutingApproved
    );
  }

  // "Rejected" from either R&A or View Moderation
  isHiddenAndRejected() {
    const { moderationStatus, routingStatus } = this.props;

    return (
      moderationStatus === 'rejected' || routingStatus === 'rejected'
    );
  }

  // "Awaiting approval" from either R&A or View Moderation
  isHiddenAndAwaitingApproval() {
    const { moderationStatus, routingStatus } = this.props;

    return (
      moderationStatus === 'pending' || routingStatus === 'pending'
    );
  }

  // Note that order here is important.
  // - Hidden takes priority, because changing any other values has no effect
  // - Privacy takes next priority, because approving it has no effect
  // - then comes the various approvals
  renderVisibilityTitle() {
    let visibilityCellText;
    let visibilityIconName;

    if (this.props.isExplicitlyHidden) {
      visibilityIconName = 'eye-blocked';
      visibilityCellText = this.getTranslation('hidden');
    } else if (this.isOpen()) {
      visibilityIconName = 'public-open';
      visibilityCellText = this.getTranslation('public');
    } else if (this.isPrivate()) {
      visibilityIconName = 'private';
      visibilityCellText = this.getTranslation('private');
    } else if (this.isHidden()) {
      visibilityIconName = 'eye-blocked';
      // visibilityCellText = this.getTranslation('hidden'); // Temporary change due to EN-17295
      visibilityCellText = this.getTranslation('pending');
    }

    return (
      <span className="title">
        <SocrataIcon name={visibilityIconName} />
        <strong>{visibilityCellText}</strong>
      </span>
    );
  }

  // Note that order here is important. If multiple cases apply, "private" takes priority over "pending",
  // and hidden "rejected" takes priority over hidden "awaiting approval", and "hidden" takes priority
  // over "pending" and "rejected" because even if it makes it through R&A/VM, it's still hidden
  renderVisibilityDescription() {
    let descriptionText;

    if (this.props.isExplicitlyHidden) {
      descriptionText = I18n.t('shared.asset_browser.result_list_table.visibility_values.hidden_from_catalog');
    } else if (this.isPrivateAndSharedToCurrentUser()) {
      descriptionText = I18n.t('shared.asset_browser.result_list_table.visibility_values.shared_to_me');
    } else if (this.isHiddenAndRejected()) {
      descriptionText = I18n.t('shared.asset_browser.result_list_table.visibility_values.rejected');
    } else if (this.isHiddenAndAwaitingApproval()) {
      descriptionText = I18n.t('shared.asset_browser.result_list_table.visibility_values.awaiting_approval');
    }

    return <div className="visibility-description">{descriptionText}</div>;
  }

  render() {
    return (
      <div className="visibility-cell">
        {this.renderVisibilityTitle()}
        {this.renderVisibilityDescription()}
      </div>
    );
  }
}

VisibilityCell.propTypes = {
  grants: PropTypes.array,
  isExplicitlyHidden: PropTypes.bool,
  isModerationApproved: PropTypes.bool,
  isPublic: PropTypes.bool.isRequired,
  isPublished: PropTypes.bool.isRequired,
  isRoutingApproved: PropTypes.bool,
  moderationStatus: PropTypes.string,
  routingStatus: PropTypes.string,
  visibleToAnonymous: PropTypes.bool.isRequired
};

export default VisibilityCell;
