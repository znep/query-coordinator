import _ from 'lodash';
import React, { Component } from 'react';
import propTypes from 'prop-types';
import { connect } from 'react-redux';
import I18nJS from 'common/i18n';
import LocalizedDate from 'common/i18n/components/LocalizedDate';
import LocalizedLink from 'common/i18n/components/LocalizedLink';
import AssetTypeIcon from 'common/components/AssetTypeIcon';
import ActionsCell from './ActionsCell';
import DetailsRow from './DetailsRow';

class Body extends Component {

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(this.props.data, nextProps.data) ||
      this.props.openDetailsId !== nextProps.openDetailsId;
  }

  renderTypeCell(data) {
    const assetTypeTooltip = I18nJS.t(`screens.admin.activity_feed.asset_types.${data.asset_type}`);

    return (
      <td scope="row" className="type">
        <AssetTypeIcon
          displayType={data.asset_type || 'dataset'}
          tooltip={assetTypeTooltip} />
      </td>
    );
  }

  renderInitiatedByCell(data) {
    const profilePath = `/profile/${data.acting_user_id}`;

    return (
      <td scope="row" className="initiated-by">
        <LocalizedLink className="unstyled-link" path={profilePath}>
          {data.acting_user_name}
        </LocalizedLink>
      </td>
    );
  }

  renderEventCell(data) {
    return (
      <td scope="row" className="event">
        {data.activity_type}
      </td>
    );
  }

  renderItemAffectedCell(data) {
    return (
      <td scope="row" className="item-affected">
        {data.affected_item}
      </td>
    );
  }

  renderDateCell(data) {
    return (
      <td scope="row" className="date">
        <LocalizedDate date={data.created_at} withTime includeSeconds />
      </td>
    );
  }

  renderActionsCell(data, openDetailsId) {
    return (
      <td scope="row" className="actions">
        <ActionsCell activity={data} openDetailsId={openDetailsId} />
      </td>
    );
  }

  renderRow = (row) => {
    const { openDetailsId } = this.props;

    const rows = [(
      <tr key={row.id} className="result-list-row">
        {this.renderTypeCell(row)}
        {this.renderInitiatedByCell(row)}
        {this.renderEventCell(row)}
        {this.renderItemAffectedCell(row)}
        {this.renderDateCell(row)}
        {this.renderActionsCell(row, openDetailsId)}
      </tr>
    )];

    if (openDetailsId && openDetailsId === row.id) {
      rows.push(<DetailsRow activity={row} />);
    }

    return rows;
  }

  render() {
    const { data } = this.props;

    return (
      <tbody>
        {data.map(this.renderRow)}
      </tbody>
    );
  }
}

Body.defaultProps = {
  data: []
};

Body.propTypes = {
  data: propTypes.array.isRequired,
  openDetailsId: propTypes.string
};

const mapStateToProps = state => ({
  data: state.table.data,
  openDetailsId: state.table.openDetailsId
});

export default connect(mapStateToProps)(Body);
