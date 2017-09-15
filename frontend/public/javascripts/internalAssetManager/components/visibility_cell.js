import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';

import { SocrataIcon } from 'common/components';

export class VisibilityCell extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'getTranslation', 'isOpen', 'isPrivate', 'isPrivateAndSharedToCurrentUser', 'isHidden',
      'isHiddenAndRejected', 'isHiddenAndAwaitingApproval', 'renderVisibilityTitle',
      'renderVisibilityDescription');
  }

  getTranslation(key) {
    return _.get(I18n, `result_list_table.visibility_values.${key}`);
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
    const { isDatalensApproved, isExplicitlyHidden, isModerationApproved, isPublished, isRoutingApproved } =
      this.props;

    return (
      !isDatalensApproved || isExplicitlyHidden || !isModerationApproved || !isPublished || !isRoutingApproved
    );
  }

  // "Rejected" from either R&A, View Moderation, or Data Lens Approval
  isHiddenAndRejected() {
    const { datalensStatus, moderationStatus, routingStatus } = this.props;

    return (
      datalensStatus === 'rejected' || moderationStatus === 'rejected' || routingStatus === 'rejected'
    );
  }

  // "Awaiting approval" from either R&A, View Moderation, or Data Lens Approval
  isHiddenAndAwaitingApproval() {
    const { datalensStatus, moderationStatus, routingStatus } = this.props;

    return (
      datalensStatus === 'pending' || moderationStatus === 'pending' || routingStatus === 'pending'
    );
  }

  // Note that order here is important. An asset can be both "Private" and "Hidden", but only the private
  // text/icon will show.
  renderVisibilityTitle() {
    let visibilityCellText;
    let visibilityIconName;

    if (this.isOpen()) {
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

  // Note that order here is important. If multiple cases apply, "private" takes priority over "hidden",
  // and hidden "rejected" takes priority over hidden "awaiting approval".
  renderVisibilityDescription() {
    let descriptionText;

    if (this.isPrivateAndSharedToCurrentUser()) {
      descriptionText = _.get(I18n, 'result_list_table.visibility_values.shared_to_me');
    } else if (this.isHiddenAndRejected()) {
      descriptionText = _.get(I18n, 'result_list_table.visibility_values.rejected');
    } else if (this.isHiddenAndAwaitingApproval()) {
      descriptionText = _.get(I18n, 'result_list_table.visibility_values.awaiting_approval');
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
  datalensStatus: PropTypes.string,
  grants: PropTypes.array,
  isDatalensApproved: PropTypes.bool,
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
