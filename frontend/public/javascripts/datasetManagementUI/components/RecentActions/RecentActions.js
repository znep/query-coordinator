import PropTypes from 'prop-types';
import React from 'react';
import {
  RevisionActivity,
  SourceActivity,
  OutputSchemaActivity,
  TaskSetActivity,
  TaskSetFinishedActivity,
  TaskSetFailedActivity
} from 'components/RecentActionItems/RecentActionItems';

const RecentActions = ({ activities, params }) => {
  const items = activities.map((activity, idx) =>
    activity.cata({
      Revision: details => <RevisionActivity key={idx} details={details} />,
      Source: details => <SourceActivity key={idx} details={details} />,
      OutputSchema: details => <OutputSchemaActivity key={idx} params={params} details={details} />,
      TaskSet: details => <TaskSetActivity key={idx} details={details} />,
      FinishedTaskSet: details => <TaskSetFinishedActivity key={idx} details={details} />,
      FailedTaskSet: details => <TaskSetFailedActivity key={idx} details={details} />,
      Empty: () => null
    })
  );

  return (
    <div>
      {items}
    </div>
  );
};

RecentActions.propTypes = {
  activities: PropTypes.array.isRequired,
  params: PropTypes.object.isRequired
};

export default RecentActions;
