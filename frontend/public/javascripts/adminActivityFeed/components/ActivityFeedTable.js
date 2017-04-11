import React from 'react';
import { connect } from 'react-redux';

import connectLocalization from './Localization/connectLocalization';
import LocalizedDate from './Localization/LocalizedDate';
import LocalizedText from './Localization/LocalizedText';

import DataTable from './DataTable/DataTable';
import AssetType from './AssetType';

import * as actions from '../actions';

class ActivityFeedTable extends React.Component {
  constructor(props) {
    super(props);

    const t = this.props.localization.translate;

    this.columns = [
      {
        id: 'type',
        title: t('columns.asset_type'),
        mapper: item => item.getIn(['data', 'entity_type']),
        template: (type) => <AssetType type={type} />
      },
      {
        id: 'event',
        title: t('columns.event'),
        mapper: item => item.getIn(['data', 'activity_type']),
        template: type => <LocalizedText localeKey={`actions.${_.snakeCase(type)}`} />
      },
      {
        id: 'name',
        title: t('columns.asset_name'),
        mapper: item => item.getIn(['dataset', 'name'])
      },
      {
        id: 'initiatedBy',
        title: t('columns.initiated_by'),
        mapper: item => item.getIn(['initiated_by', 'displayName'])
      },
      {
        id: 'dateStarted',
        title: t('columns.date_started'),
        mapper: item => item.getIn(['data', 'created_at']),
        template: date => <LocalizedDate date={date} />
      },
      {
        id: 'status',
        title: t('columns.status'),
        mapper: item => item.getIn(['data', 'status']),
        template: status => <LocalizedText localeKey={`statuses.${_.snakeCase(status)}`} />
      },
      {
        id: 'actions',
        title: '',
        mapper: () => ''
      }
    ];

    this.rowIdGetter = (item, index) => index;
  }

  render() {
    const { activities } = this.props;

    return <DataTable data={activities} columns={this.columns} rowIdGetter={this.rowIdGetter} />;
  }
}

const mapStateToProps = (state) => {
  return {
    activities: state.get('activities')
  };
};

const mapDispatchToProps = (dispatch) => {
  return {
    showRestoreModal: (activity) => dispatch(actions.showRestoreModal(activity)),
    showDetailsModal: (activity) => dispatch(actions.showDetailsModal(activity))
  };
};

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(ActivityFeedTable));
