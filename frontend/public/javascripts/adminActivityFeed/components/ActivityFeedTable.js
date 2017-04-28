import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import connectLocalization from './Localization/connectLocalization';
import LocalizedDate from './Localization/LocalizedDate';
import LocalizedText from './Localization/LocalizedText';

import DataTable from './DataTable/DataTable';
import AssetType from './AssetType';
import ActivityFeedPagination from './ActivityFeedPagination';

import { showDetailsModal, showRestoreModal } from '../actions';

import './ActivityFeedTable.scss';

class ActivityFeedTable extends React.Component {
  constructor(props) {
    super(props);

    const { dispatchShowRestoreModal, localization } = props;

    this.columns = [
      {
        id: 'type',
        title: localization.translate('columns.asset_type'),
        mapper: item => item.getIn(['data', 'entity_type']),
        template: (type) => <AssetType type={type} />
      },
      {
        id: 'event',
        title: localization.translate('columns.event'),
        mapper: item => item.getIn(['data', 'activity_type']),
        template: type => <LocalizedText localeKey={`actions.${_.snakeCase(type)}`} />
      },
      {
        id: 'name',
        title: localization.translate('columns.asset_name'),
        mapper: item => item.getIn(['dataset', 'name'])
      },
      {
        id: 'initiatedBy',
        title: localization.translate('columns.initiated_by'),
        mapper: item => item.getIn(['initiated_by', 'displayName'])
      },
      {
        id: 'dateStarted',
        title: localization.translate('columns.date_started'),
        mapper: item => item.getIn(['data', 'created_at']),
        template: date => <LocalizedDate date={date} />
      },
      {
        id: 'status',
        title: localization.translate('columns.status'),
        mapper: item => item.getIn(['data', 'status']),
        template: status => <LocalizedText localeKey={`statuses.${_.snakeCase(status)}`} />
      },
      {
        id: 'actions',
        title: '',
        mapper: _.identity,
        template: item => {
          const showDetailsButton = ['SuccessWithDataErrors', 'Failure'].includes(item.getIn(['data', 'status']));

          const showRestoreButton = (
            item.get('dataset') &&
            (item.getIn(['dataset', 'flags']) || []).indexOf('restorable') > -1 &&
            item.getIn(['dataset', 'deleted']) &&
            item.getIn(['data', 'first_deleted_in_list']) &&
            item.getIn(['data', 'activity_type']) === 'Delete'
          );

          const isRestored = (
            item.getIn(['data', 'activity_type']) === 'Delete' &&
            !item.getIn(['dataset', 'deleted'])
          );

          if (showRestoreButton) {
            return (
              <button
                className="restore-modal-link button-as-link"
                onClick={_.bind(dispatchShowRestoreModal, this, item.toJS())}>
                <LocalizedText localeKey='restore'/>
              </button>
            );
          } else if (isRestored) {
            return <LocalizedText localeKey='restored' className="restored-dataset"/>;
          } else if (showDetailsButton) {
            return (
              <button
                className="details-modal-link button-as-link"
                onClick={_.bind(props.dispatchShowDetailsModal, this, item)}>
                <LocalizedText localeKey='view_details'/>
              </button>
            );
          }
        }
      }
    ];

    this.rowIdGetter = (item, index) => index;
  }

  render() {
    const { activities } = this.props;

    return (
      <div className="activity-feed-table">
        <DataTable data={activities} columns={this.columns} rowIdGetter={this.rowIdGetter} />
        <ActivityFeedPagination />
      </div>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    activities: state.get('activities')
  };
};

const mapDispatchToProps = (dispatch) => ({
  dispatchShowDetailsModal: (activity) => dispatch(showDetailsModal(activity)),
  dispatchShowRestoreModal: (activity) => dispatch(showRestoreModal(activity))
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(ActivityFeedTable));
