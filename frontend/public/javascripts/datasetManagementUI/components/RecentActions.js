import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
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
  return (<div key={key} className={styles.activity} data-activity-type="update">
    <div className={styles.timeline}>
      <SocrataIcon name="plus2" className={styles.icon} />
    </div>
    <div>
      <p>
        <span className={styles.createdBy}>{creator(update)}</span>&nbsp;
        opened a revision
      </p>
      <RecentActionsTimestamp date={at} />
    </div>
  </div>);
};

const uploadActivity = (upload, at) => {
  const key = `upload-${upload.id}`;
  return (<div key={key} className={styles.activity} data-activity-type="upload">
    <div className={styles.timeline}>
      <SocrataIcon name="data" className={styles.icon} />
    </div>
    <div>
      <p>
        <span className={styles.createdBy}>{creator(upload)}</span>&nbsp;
        uploaded a file
      </p>
      <RecentActionsTimestamp date={at} />
    </div>
  </div>);
};


const outputSchemaActivity = (item, at) => {
  const key = `os-${item.outputSchema.id}`;
  return (<div key={key} className={styles.activity} data-activity-type="outputschema">
    <div className={styles.timeline}>
      <SocrataIcon name="edit" className={styles.icon} />
    </div>
    <div>
      <p>
        <span className={styles.createdBy}>{creator(item.outputSchema)}</span>&nbsp;
        changed the&nbsp;
        <Link to={Links.showOutputSchema(item.upload.id, item.inputSchema.id, item.outputSchema.id)}>
          schema
        </Link>
      </p>
      <RecentActionsTimestamp date={at} />
    </div>
  </div>);
};

const upsertActivity = (upsert, at) => {
  const key = `upsert-${upsert.id}`;
  return (<div key={key} className={styles.activity} data-activity-type="upsert">
    <div className={styles.timeline}>
      <SocrataIcon name="dataset" className={styles.icon} />
    </div>
    <div>
      <p>
        <span className={styles.createdBy}>{creator(upsert)}</span>&nbsp;
        started data processing
      </p>
      <RecentActionsTimestamp date={at} />
    </div>
  </div>);
};


const upsertCompletedActivity = (upsert, at) => {
  const key = `completed-upsert-${upsert.id}`;
  return (<div key={key} className={styles.activity} data-activity-type="upsertcompleted">
    <div className={styles.timeline}>
      <SocrataIcon name="checkmark3" className={styles.icon} />
    </div>
    <div>
      <p>
        Data processing successfully finished
      </p>
      <RecentActionsTimestamp date={at} />
    </div>
  </div>);
};

const upsertFailedActivity = (upsert, at) => {
  const key = `failed-upsert-${upsert.id}`;
  return (<div key={key} className={styles.activity} data-activity-type="upsertfailed">
    <div className={styles.timeline}>
      <SocrataIcon name="failed" className={styles.icon} />
    </div>
    <div>
      <p>
        Data processing failed
      </p>
      <RecentActionsTimestamp date={at} />
    </div>
  </div>);
};

function activitiesOf(entities) {
  const updateModel = _.values(entities.revisions)[0];
  if (!updateModel) return [];
  const update = {
    type: 'update',
    value: updateModel,
    at: updateModel.created_at
  };
  const uploads = _.map(entities.uploads, (upload) => ({
    type: 'upload',
    value: upload,
    at: upload.created_at
  }));
  const outputSchemas = _.map(entities.output_schemas, (outputSchema) => {
    const inputSchema = _.find(entities.input_schemas, { id: outputSchema.input_schema_id });
    const upload = _.find(entities.uploads, { id: inputSchema.upload_id });
    return {
      type: 'outputSchema',
      at: outputSchema.created_at,
      value: {
        outputSchema,
        inputSchema,
        upload
      }
    };
  });
  const upserts = _.map(entities.task_sets, (upsertJob) => ({
    type: 'upsert',
    value: upsertJob,
    at: upsertJob.created_at
  }));

  const finishedUpserts = _.chain(entities.task_sets).
    filter((upsertJob) => !!upsertJob.finished_at).
    filter((upsertJob) => upsertJob.status === ApplyRevision.TASK_SET_SUCCESSFUL).
    map((upsertJob) => ({
      type: 'upsertCompleted',
      value: upsertJob,
      at: upsertJob.finished_at
    })
  );

  const failedUpserts = _.chain(entities.task_sets).
    filter((upsertJob) => !!upsertJob.finished_at).
    filter((upsertJob) => upsertJob.status === ApplyRevision.TASK_SET_FAILURE).
    map((upsertJob) => ({
      type: 'upsertFailed',
      value: upsertJob,
      at: upsertJob.finished_at
    })
  );


  const kinds = {
    update: updateActivity,
    upload: uploadActivity,
    outputSchema: outputSchemaActivity,
    upsert: upsertActivity,
    upsertCompleted: upsertCompletedActivity,
    upsertFailed: upsertFailedActivity
  };

  const toView = (activity) => {
    const fn = kinds[activity.type];
    return fn && fn(activity.value, activity.at);
  };

  const items = [
    update,
    ...uploads,
    ...outputSchemas,
    ...upserts,
    ...finishedUpserts,
    ...failedUpserts
  ];
  return _.reverse(_.sortBy(items, 'at')).map(toView);
}

function RecentActions({ entities }) {
  const items = activitiesOf(entities);
  return (
    <div>
      {items}
    </div>
  );
}

RecentActions.propTypes = {
  routing: PropTypes.object.isRequired,
  entities: PropTypes.object.isRequired
};

const mapStateToProps = ({ entities, ui }) => ({
  entities,
  routing: ui.routing.location
});

export default connect(mapStateToProps)(RecentActions);
