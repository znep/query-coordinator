import _ from 'lodash';
import React, { Component } from 'react';
import propTypes from 'prop-types';
import { connect } from 'react-redux';
import I18nJS from 'common/i18n';
import LocalizedDate from 'common/i18n/components/LocalizedDate';
import LocalizedLink from 'common/i18n/components/LocalizedLink';
import AssetTypeIcon from 'common/components/AssetTypeIcon';

class Body extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, ['renderRow']);
  }

  shouldComponentUpdate(nextProps) {
    return !_.isEqual(this.props.data, nextProps.data);
  }

  renderTypeCell(data) {
    const assetTypeTooltip = I18nJS.t(`screens.admin.activity_feed.asset_types.${data.asset_type}`);

    return (
      <td scope="row" className="type">
        <AssetTypeIcon
          displayType={data.asset_type}
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
        {data.dataset_name || data.view_name}
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

  renderActionsCell() {
    return (
      <td scope="row" className="actions"></td>
    );
  }

  renderRow(row) {
    return (
      <tr key={row.id} className="result-list-row">
        {this.renderTypeCell(row)}
        {this.renderInitiatedByCell(row)}
        {this.renderEventCell(row)}
        {this.renderItemAffectedCell(row)}
        {this.renderDateCell(row)}
        {this.renderActionsCell(row)}
      </tr>
    );
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
  data: propTypes.array.isRequired
};

const mapStateToProps = state => ({
  data: state.table.data
});

export default connect(mapStateToProps)(Body);
