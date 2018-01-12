import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';

import I18n from 'common/i18n';
import SocrataIcon from 'common/components/SocrataIcon';

export class VisibilityCell extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'getTranslation', 'isOpen', 'isPrivate', 'isSharedToCurrentUser', 'isHidden',
      'isRejected', 'isPending');
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

  isSharedToCurrentUser() {
    const currentUserId = _.get(window.socrata, 'currentUser.id');

    return !!_.find(this.props.grants, (grant) => grant.user_id === currentUserId);
  }

  isHidden() {
    const { isExplicitlyHidden, isModerationApproved, isPublished, isRoutingApproved } = this.props;

    return isExplicitlyHidden || !isModerationApproved || !isPublished || !isRoutingApproved;
  }

  // "Rejected" from either R&A or View Moderation
  isRejected() {
    const { moderationStatus, routingStatus } = this.props;

    return moderationStatus === 'rejected' || routingStatus === 'rejected';
  }

  // "Awaiting approval" from either R&A or View Moderation
  isPending() {
    const { moderationStatus, routingStatus } = this.props;

    return moderationStatus === 'pending' || (routingStatus === 'pending' && moderationStatus !== 'rejected');
  }

  // Note that order here is important.
  // - Hidden takes priority, because changing any other values has no effect
  // - Privacy takes next priority, because approving it has no effect
  // - then comes the various approvals
  render() {
    let visibilityCellText = this.getTranslation('pending');
    let visibilityIconName = 'private';
    let descriptionText;

    if (this.isOpen()) {
      visibilityIconName = 'public-open';
      visibilityCellText = this.getTranslation('public');
    }

    if (this.isPrivate()) {
      visibilityIconName = 'private';
      visibilityCellText = this.getTranslation('private');
    }

    if (this.isHidden() && !this.isPrivate() && !this.isOpen()) {
      visibilityIconName = 'eye-blocked';
      visibilityCellText = this.getTranslation('private');  // See EN-17295
    }

    if (this.isRejected()) {
      visibilityIconName = 'eye-blocked';
      visibilityCellText = this.getTranslation('hidden');
      descriptionText = this.getTranslation('rejected');
    }

    if (this.props.isExplicitlyHidden) {
      visibilityIconName = 'eye-blocked';
      visibilityCellText = this.getTranslation('hidden');
      descriptionText = this.getTranslation('hidden_from_catalog');
    }

    if (this.isSharedToCurrentUser()) {
      descriptionText = this.getTranslation('shared_to_me');
    }

    if (this.isPending()) {
      visibilityIconName = 'eye-blocked';
      visibilityCellText = this.getTranslation('private');
      descriptionText = this.getTranslation('awaiting_approval');
    }

    const renderDescription = (descriptionText) => {
      if (_.isEmpty(descriptionText)) {
        return;
      }

      return (
        <div className="visibility-description">
          ({descriptionText})
        </div>
      );
    };

    return (
      <div className="visibility-cell">
        <span className="title">
          <SocrataIcon name={visibilityIconName} />
          <strong>{visibilityCellText}</strong>
        </span>
        {renderDescription(descriptionText)}
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
