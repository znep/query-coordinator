import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import I18nJS from 'common/i18n';
import classNames from 'classnames';
import moment from 'moment';
import { DATE_TIME_FORMAT } from '../constants';
import { buildSelectClause, buildWhereClause, buildOrderClause, downloadQuery } from '../lib/queryBuilder';

class DownloadLink extends Component {
  shouldComponentUpdate(nextProps) {

    return !_.isEqual(this.props, nextProps);
  }

  render() {
    const { data, filters, order } = this.props;

    if (data.length === 0) {
      return null;
    }

    const columns = [
      'id',
      'asset_type',
      'affected_item',
      'acting_user_name',
      'activity_type',
      'created_at'
    ];

    const parts = [
      buildSelectClause(columns),
      buildWhereClause(filters),
      buildOrderClause(order)
    ];

    const title = I18nJS.t('screens.admin.activity_feed.download');
    const timestamp = moment().format(DATE_TIME_FORMAT);

    const buttonProps = {
      className: classNames('btn btn-primary btn-inverse', { 'btn-disabled': false }),
      href: downloadQuery(parts),
      download: `Activity Log ${timestamp}.csv`,
      title
    };

    return (
      <div className="asset-inventory-link-wrapper">
        <a {...buttonProps}>
          {title}
        </a>
      </div>
    );
  }
}

DownloadLink.propTypes = {
  data: PropTypes.array.isRequired,
  filters: PropTypes.object.isRequired,
  order: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  data: state.table.data,
  filters: state.filters,
  order: state.order
});

export default connect(mapStateToProps)(DownloadLink);
