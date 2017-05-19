import React, { PropTypes } from 'react';
import _ from 'lodash';

export class VisibilityCell extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, 'getLocale', 'renderInternalDescription');
  }

  getLocale(key) {
    return _.get(I18n, `result_list_table.visibility_values.${key}`);
  }

  // List of potential reasons why the asset is internal
  renderInternalDescription() {
    const { isDataLensApproved, isHidden, isModerationApproved, isPublic, isPublished, isRoutingApproved } =
      this.props;

    const renderListElement = (localeKey) => (
      <li>{this.getLocale(localeKey)}</li>
    );

    const unpublishedListElement = (isPublished === false) ? renderListElement('unpublished') : null;

    const privateListElement = (isPublic === false) ? renderListElement('private') : null;

    const viewModerationListElement = (isModerationApproved === false) ?
      renderListElement('moderation_not_approved') : null;

    const routingApprovalListElement = (isRoutingApproved === false) ?
      renderListElement('routing_not_approved') : null;

    const dataLensNotApprovedListElement = (isDataLensApproved === false) ?
      renderListElement('datalens_not_approved') : null;

    const assetHiddenListElement = (isHidden === true) ? renderListElement('hidden') : null;

    return (
      <ul>
        {unpublishedListElement}
        {privateListElement}
        {viewModerationListElement}
        {routingApprovalListElement}
        {dataLensNotApprovedListElement}
        {assetHiddenListElement}
      </ul>
    );
  }

  render() {
    const { visibleToAnonymous } = this.props;

    const visibilityCellClass = visibleToAnonymous ? 'socrata-icon-geo' : 'socrata-icon-private';
    const visibilityCellText = this.getLocale(visibleToAnonymous ? 'open' : 'internal');

    return (
      <div className="visibility-cell">
        <span className="title">
          <span alt={visibilityCellText} className={visibilityCellClass} />
          <strong>{visibilityCellText}</strong>
        </span>
        {this.renderInternalDescription()}
      </div>
    );
  }
}

VisibilityCell.propTypes = {
  isDataLensApproved: PropTypes.bool,
  isHidden: PropTypes.bool,
  isModerationApproved: PropTypes.bool,
  isPublic: PropTypes.bool.isRequired,
  isPublished: PropTypes.bool.isRequired,
  isRoutingApproved: PropTypes.bool,
  visibleToAnonymous: PropTypes.bool.isRequired
};

export default VisibilityCell;
