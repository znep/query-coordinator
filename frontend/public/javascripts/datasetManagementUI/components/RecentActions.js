import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import { Link, withRouter } from 'react-router';
import * as Links from '../links';
import moment from 'moment';
import SocrataIcon from '../../common/components/SocrataIcon';
import * as ApplyRevision from '../actions/applyRevision';
import styles from 'styles/RecentActions.scss';

function RecentActionsTimestamp({ date }) {
  return (
    <span className={styles.timestamp}>
      {moment.utc(date).fromNow()}
    </span>
  );
}

// Actaully expects a Date but there's no specific proptype for that
RecentActionsTimestamp.propTypes = {
  date: PropTypes.object.isRequired
};

function creator(item) {
  if (item.created_by) {
    return item.created_by.display_name;
  }
  return 'Unknown';
}

const updateActivity = (update, at) => {
  const key = `update-${update.id}`;
  return (
    <div key={key} className={styles.activity} data-activity-type="update">
      <div className={styles.timeline}>
        <SocrataIcon name="plus2" className={styles.icon} />
      </div>
      <div>
        <p>
          <span className={styles.createdBy}>{creator(update)}</span> opened a revision
        </p>
        <RecentActionsTimestamp date={at} />
      </div>
    </div>
  );
};

const sourceActivity = (source, at) => {
  const key = `source-${source.id}`;
  return (
    <div key={key} className={styles.activity} data-activity-type="source">
      <div className={styles.timeline}>
        <SocrataIcon name="data" className={styles.icon} />
      </div>
      <div>
        <p>
          <span className={styles.createdBy}>{creator(source)}</span> uploaded a file
        </p>
        <RecentActionsTimestamp date={at} />
      </div>
    </div>
  );
};

const outputSchemaActivity = (item, at, params) => {
  const key = `os-${item.outputSchema.id}`;
  return (
    <div key={key} className={styles.activity} data-activity-type="outputschema">
      <div className={styles.timeline}>
        <SocrataIcon name="edit" className={styles.icon} />
      </div>
      <div>
        <p>
          <span className={styles.createdBy}>{creator(item.outputSchema)}</span> changed the&nbsp;
          <Link
            to={Links.showOutputSchema(params, item.source.id, item.inputSchema.id, item.outputSchema.id)}>
            schema
          </Link>
        </p>
        <RecentActionsTimestamp date={at} />
      </div>
    </div>
  );
};

const taskSetActivity = (taskSet, at) => {
  const key = `taskSet-${taskSet.id}`;
  return (
    <div key={key} className={styles.activity} data-activity-type="taskSet">
      <div className={styles.timeline}>
        <SocrataIcon name="dataset" className={styles.icon} />
      </div>
      <div>
        <p>
          <span className={styles.createdBy}>{creator(taskSet)}</span> started data processing
        </p>
        <RecentActionsTimestamp date={at} />
      </div>
    </div>
  );
};

const taskSetCompletedActivity = (taskSet, at) => {
  const key = `completed-taskSet-${taskSet.id}`;
  return (
    <div key={key} className={styles.activity} data-activity-type="taskSetcompleted">
      <div className={styles.timeline}>
        <SocrataIcon name="checkmark3" className={styles.icon} />
      </div>
      <div>
        <p>Data processing successfully finished</p>
        <RecentActionsTimestamp date={at} />
      </div>
    </div>
  );
};

const taskSetFailedActivity = (taskSet, at) => {
  const key = `failed-taskSet-${taskSet.id}`;
  return (
    <div key={key} className={styles.activity} data-activity-type="taskSetfailed">
      <div className={styles.timeline}>
        <SocrataIcon name="failed" className={styles.icon} />
      </div>
      <div>
        <p>Data processing failed</p>
        <RecentActionsTimestamp date={at} />
      </div>
    </div>
  );
};

function activitiesOf(entities, params) {
  const updateModel = _.values(entities.revisions)[0];
  if (!updateModel) return [];
  const update = {
    type: 'update',
    value: updateModel,
    at: updateModel.created_at,
    params
  };
  const sources = _.map(entities.sources, source => ({
    type: 'source',
    value: source,
    at: source.created_at,
    params
  }));
  const outputSchemas = _.map(entities.output_schemas, outputSchema => {
    const inputSchema = _.find(entities.input_schemas, { id: outputSchema.input_schema_id });
    const source = _.find(entities.sources, { id: inputSchema.source_id });
    return {
      type: 'outputSchema',
      at: outputSchema.created_at,
      value: {
        outputSchema,
        inputSchema,
        source
      },
      params
    };
  });
  const taskSets = _.map(entities.task_sets, taskSet => ({
    type: 'taskSet',
    value: taskSet,
    at: taskSet.created_at,
    params
  }));

  const finishedTaskSets = _.chain(entities.task_sets)
    .filter(taskSet => !!taskSet.finished_at)
    .filter(taskSet => taskSet.status === ApplyRevision.TASK_SET_SUCCESSFUL)
    .map(taskSet => ({
      type: 'taskSetCompleted',
      value: taskSet,
      at: taskSet.finished_at,
      params
    }));

  const failedTaskSets = _.chain(entities.task_sets)
    .filter(taskSet => !!taskSet.finished_at)
    .filter(taskSet => taskSet.status === ApplyRevision.TASK_SET_FAILURE)
    .map(taskSet => ({
      type: 'taskSetFailed',
      value: taskSet,
      at: taskSet.finished_at,
      params
    }));

  const kinds = {
    update: updateActivity,
    source: sourceActivity,
    outputSchema: outputSchemaActivity,
    taskSet: taskSetActivity,
    taskSetCompleted: taskSetCompletedActivity,
    taskSetFailed: taskSetFailedActivity
  };

  const toView = activity => {
    const fn = kinds[activity.type];
    return fn && fn(activity.value, activity.at, activity.params);
  };

  const items = [update, ...sources, ...outputSchemas, ...taskSets, ...finishedTaskSets, ...failedTaskSets];
  return _.reverse(_.sortBy(items, 'at')).map(toView);
}

export function RecentActions({ entities, params }) {
  const items = activitiesOf(entities, params);
  return (
    <div>
      {items}
    </div>
  );
}

RecentActions.propTypes = {
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};

const mapStateToProps = ({ entities }) => ({
  entities
});

export default withRouter(connect(mapStateToProps)(RecentActions));
