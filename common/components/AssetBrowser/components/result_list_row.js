import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import moment from 'moment';
import _ from 'lodash';

import AssetTypeIcon from 'common/components/AssetTypeIcon';
import { FeatureFlags } from 'common/feature_flags';
import I18n from 'common/i18n';

import * as constants from 'common/components/AssetBrowser/lib/constants';
import Provenance from './provenance';
import VisibilityCell from './visibility_cell';

export class ResultListRow extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'renderCell'
    ]);
  }

  renderCell(columnName, index) {
    let { link } = this.props;
    const {
      actionElement,
      activeTab,
      approvals,
      description,
      isOwner,
      isPublished,
      name,
      ownerName,
      provenance,
      type,
      uid,
      updatedAt
    } = this.props;

    const scope = 'shared.asset_browser.result_list_table';

    const cellTag = (value) => (
      <td scope="row" className={columnName} key={`${columnName}-${index}`}>{value}</td>
    );

    if (type === 'story') {
      const rights = _.get(window.serverConfig, 'currentUser.rights');
      if ((isOwner && _.includes(rights, 'edit_story')) ||
          (!isOwner && _.includes(rights, 'edit_others_stories'))) {
        link += '/edit';
      }
    }

    // This used to be a switch-case, but that form was causing
    // a babel transpiler crash (yeah).
    if (columnName === 'lastUpdatedDate') {
      const dateString = moment(updatedAt).format('LL');
      return cellTag(dateString);
    }

    if (columnName === 'actions') {
      return cellTag(React.createElement(actionElement, this.props));
    }

    const approval = approvals[0] || {};
     // TODO: what do we do when there are multiple approvals?
    if (approvals.length > 1) {
      console.warn(`There are multiple approval records for resource ${name} (${uid})!`);
      console.dir(approvals);
    }

    if (columnName === 'submitted_at') {
      const approvalRequestedDateString = moment(approval.submitted_at).format('LL');
      return cellTag(approvalRequestedDateString);
    }

    if (columnName === 'status') {
      const state = approval.state || 'not_ready';
      const approvalStatus = I18n.t(`approval_status_values.${state}`, { scope });
      return cellTag(approvalStatus);
    }

    if (columnName === 'name') {
      return (cellTag(
        <div>
          <a href={link}><span className="name">{name}</span></a>
          <Provenance provenance={provenance} includeLabel={false} />
          <span className="description">{description}</span>
        </div>
      ));
    }

    if (columnName === 'owner') {
      return cellTag(ownerName);
    }

    if (columnName === 'type') {
      let assetTypeTooltip = I18n.t(`shared.asset_browser.asset_types.${type}`);
      if (type === 'dataset' && !isPublished) {
        assetTypeTooltip = I18n.t('shared.asset_browser.asset_types.working_copy');
      }
      if (type === 'href' && FeatureFlags.value('usaid_features_enabled')) {
        assetTypeTooltip = I18n.t('shared.asset_browser.asset_types.data_asset');
      }

      const displayType = (FeatureFlags.value('usaid_features_enabled') && type === 'href') ?
        'data_asset' : type;

      return cellTag(
        <AssetTypeIcon
          displayType={displayType}
          isPublished={isPublished}
          tooltip={assetTypeTooltip} />
      );
    }

    if (columnName === 'visibility') {
      const visibilityCellProps = _.pick(this.props,
        ['datalensStatus', 'grants', 'isDatalensApproved', 'isExplicitlyHidden', 'isModerationApproved',
          'isPublic', 'isPublished', 'isRoutingApproved', 'moderationStatus', 'routingStatus',
          'visibleToAnonymous']
      );

      return cellTag(<VisibilityCell {...visibilityCellProps} />);
    }

    return cellTag(this.props[columnName]);
  }

  render() {
    const { columns } = this.props;

    return (
      <tr className="result-list-row">
        {columns.map((columnName, index) => this.renderCell(columnName, index))}
      </tr>
    );
  }
}

ResultListRow.defaultProps = {
  approvals: []
};

ResultListRow.propTypes = {
  actionElement: PropTypes.func,
  activeTab: PropTypes.string.isRequired,
  approvals: PropTypes.array,
  category: PropTypes.string,
  columns: PropTypes.array.isRequired,
  datalensStatus: PropTypes.string,
  description: PropTypes.string,
  grants: PropTypes.array,
  isDatalensApproved: PropTypes.bool,
  isExplicitlyHidden: PropTypes.bool,
  isModerationApproved: PropTypes.bool,
  isOwner: PropTypes.bool.isRequired,
  isPublic: PropTypes.bool.isRequired,
  isPublished: PropTypes.bool.isRequired,
  isRoutingApproved: PropTypes.bool,
  link: PropTypes.string,
  moderationStatus: PropTypes.string,
  name: PropTypes.string,
  ownerName: PropTypes.string,
  provenance: PropTypes.string,
  routingStatus: PropTypes.string,
  type: PropTypes.string,
  uid: PropTypes.string.isRequired,
  updatedAt: PropTypes.string,
  visibleToAnonymous: PropTypes.bool.isRequired
};

const mapStateToProps = state => ({
  activeTab: state.header.activeTab,
  columns: state.catalog.columns
});

export default connect(mapStateToProps)(ResultListRow);
