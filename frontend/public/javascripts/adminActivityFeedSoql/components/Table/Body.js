import _ from 'lodash';
import React, { Component } from 'react';
import propTypes from 'prop-types';
import { connect } from 'react-redux';
import I18nJS from 'common/i18n';
import LocalizedDate from 'common/i18n/components/LocalizedDate';
import LocalizedText from 'common/i18n/components/LocalizedText';
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
    let tooltip = I18nJS.lookup(`screens.admin.activity_feed.asset_types.${data.asset_type}`);
    let displayType = data.asset_type;

    if (!tooltip) {
      tooltip = I18nJS.lookup('screens.admin.activity_feed.asset_types.dataset');
      displayType = 'dataset';
    }

    return (
      <td scope="row" className="type">
        <AssetTypeIcon {...{ tooltip, displayType }} />
      </td>
    );
  }

  renderInitiatedByCell(data) {
    let profileLink;

    if (!_.isUndefined(data.acting_user_id)) {
      const profilePath = `/profile/${data.acting_user_id}`;

      profileLink = (
        <LocalizedLink className="unstyled-link" path={profilePath}>
          {data.acting_user_name}
        </LocalizedLink>
      );
    }

    return (
      <td scope="row" className="initiated-by">
        {profileLink}
      </td>
    );
  }

  renderEventCell(data) {
    const localeKey = `screens.admin.activity_feed.filters.events.options.${_.snakeCase(data.activity_type)}`;

    return (
      <td scope="row" className="event">
        <LocalizedText localeKey={localeKey} />
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
