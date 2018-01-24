import PropTypes from 'prop-types';
import React from 'react';
import { ACTIVITY_TYPES } from 'datasetManagementUI/containers/RecentActionsContainer';
import {
  RevisionActivity,
  SourceActivity,
  OutputSchemaActivity,
  TaskSetActivity,
  TaskSetFinishedActivity,
  TaskSetFailedActivity
} from 'datasetManagementUI/components/RecentActionItems/RecentActionItems';

const RecentActions = ({ activities, params }) => {
  const items = activities.map((activity, idx) => {
    switch (activity.type) {
      case ACTIVITY_TYPES.revision:
        return <RevisionActivity key={idx} details={activity} />;
      case ACTIVITY_TYPES.source:
        return <SourceActivity key={idx} details={activity} />;
      case ACTIVITY_TYPES.outputSchema:
        return <OutputSchemaActivity key={idx} params={params} details={activity} />;
      case ACTIVITY_TYPES.taskSet:
        return <TaskSetActivity key={idx} details={activity} />;
      case ACTIVITY_TYPES.taskSetFailed:
        return <TaskSetFailedActivity key={idx} details={activity} />;
      case ACTIVITY_TYPES.taskSetFinished:
        return <TaskSetFinishedActivity key={idx} details={activity} />;
      default:
        return null;
    }
  });

  return <div>{items}</div>;
};

RecentActions.propTypes = {
  activities: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired
};

export default RecentActions;
