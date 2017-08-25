import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';

import LocalizedDate from 'common/i18n/components/LocalizedDate';
import LocalizedText from 'common/i18n/components/LocalizedText';
import * as helpers from '../helpers';

import ActivityFeedTableHeaderColumn from './ActivityFeedTableHeaderColumn';
import DataTable from './DataTable/DataTable';
import ActivityFeedPagination from './ActivityFeedPagination';
import AssetName from './AssetName';
import ActivityActions from './ActivityActions';
import Status from './Status';
import InitiatedBy from './InitiatedBy';

import { showDetailsModal, showRestoreModal } from '../actions';
import './ActivityFeedTable.scss';

class ActivityFeedTable extends React.Component {
  constructor(props) {
    super(props);

    this.columns = [
      {
        id: 'dateStarted',
        title: <LocalizedText localeKey='screens.admin.jobs.columns.date_started'/>,
        mapper: item => item.getIn(['data', 'created_at']),
        template: date => <LocalizedDate date={date} withTime includeSeconds/>
      },
      {
        id: 'event',
        title: <LocalizedText localeKey='screens.admin.jobs.columns.event'/>,
        mapper: helpers.activities.getType,
        template: type => <LocalizedText localeKey={`screens.admin.jobs.actions.${type}`}/>
      },
      {
        id: 'name',
        title: <LocalizedText localeKey='screens.admin.jobs.columns.asset_name'/>,
        mapper: _.identity,
        template: activity => <AssetName activity={activity}/>
      },
      {
        id: 'initiatedBy',
        title: <LocalizedText localeKey='screens.admin.jobs.columns.initiated_by'/>,
        mapper: activity => (
            <InitiatedBy activity={activity}/>
        )
      },
      {
        id: 'status',
        title: <LocalizedText localeKey='screens.admin.jobs.columns.status'/>,
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
      <div className='activity-feed-table'>
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

export default connect(mapStateToProps, mapDispatchToProps)(ActivityFeedTable);
