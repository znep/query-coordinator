import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import connectLocalization from './Localization/connectLocalization';
import LocalizedDate from './Localization/LocalizedDate';
import LocalizedText from './Localization/LocalizedText';
import * as helpers from '../helpers';

import ActivityFeedTableHeaderColumn from './ActivityFeedTableHeaderColumn';
import DataTable from './DataTable/DataTable';
import ActivityFeedPagination from './ActivityFeedPagination';
import AssetName from './AssetName';
import ActivityActions from './ActivityActions';
import Status from './Status';

import { showDetailsModal, showRestoreModal } from '../actions';
import './ActivityFeedTable.scss';

class ActivityFeedTable extends React.Component {
  constructor(props) {
    super(props);

    const localization = props.localization;
    const t = localization.translate;

    this.columns = [
      {
        id: 'dateStarted',
        title: t('columns.date_started'),
        mapper: item => item.getIn(['data', 'created_at']),
        template: date => <LocalizedDate date={date}/>
      },
      {
        id: 'event',
        title: t('columns.event'),
        mapper: helpers.activities.getType,
        template: type => <LocalizedText localeKey={`actions.${type}`}/>
      },
      {
        id: 'name',
        title: t('columns.asset_name'),
        mapper: _.identity,
        template: activity => <AssetName activity={activity}/>
      },
      {
        id: 'initiatedBy',
        title: t('columns.initiated_by'),
        mapper: activity => <span>{activity.getIn(['initiated_by', 'displayName'], '')}</span>
      },
      {
        id: 'status',
        title: t('columns.status'),
        mapper: helpers.activities.getStatus,
        template: status => <Status status={status}/>
      },
      {
        id: 'actions',
        title: '',
        mapper: _.identity,
        template: activity => {
          return <ActivityActions
            activity={activity}
            onShowDetails={this.props.onShowActivityDetails}
            onRestore={this.props.onRestoreActivity}  />;
        }
      }
    ];

    this.rowIdGetter = (item, index) => index;
  }

  render() {
    const { activities } = this.props;

    return (
      <div className="activity-feed-table">
        <DataTable
          data={activities}
          columns={this.columns}
          rowIdGetter={this.rowIdGetter}
          headerColumnComponent={ActivityFeedTableHeaderColumn}
          sorting={this.sorting}/>
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
  onShowActivityDetails: (activity) => dispatch(showDetailsModal(activity)),
  onRestoreActivity: (activity) => dispatch(showRestoreModal(activity))
});

export default connectLocalization(connect(mapStateToProps, mapDispatchToProps)(ActivityFeedTable));
