import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import * as Links from '../links';
import moment from 'moment';
import _ from 'lodash';

function ActivityFeedTimestamp({ date }) {
  return (
    <span className="activity-timestamp small">
      {moment.utc(date).fromNow()}
    </span>
  );
}

ActivityFeedTimestamp.propTypes = {
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
  return (<div key={key} className="activity update">
    <div className="timeline">
      <i className="socrata-icon-plus2" />
    </div>
    <div className="activity-info">
      <p>
        <span className="created-by">{creator(update)}</span>&nbsp;
        opened an update
      </p>
      <ActivityFeedTimestamp date={at} />
    </div>
  </div>);
};

const uploadActivity = (upload, at) => {
  const key = `upload-${upload.id}`;
  return (<div key={key} className="activity upload">
    <div className="timeline">
      <i className="socrata-icon-data" />
    </div>
    <div className="activity-info">
      <p>
        <span className="created-by">{creator(upload)}</span>&nbsp;
        uploaded a <Link to={Links.showUpload(upload.id)}>file</Link>
      </p>
      <ActivityFeedTimestamp date={at} />
    </div>
  </div>);
};


const outputSchemaActivity = (item, at) => {
  const key = `os-${item.outputSchema.id}`;
  return (<div key={key} className="activity output-schema">
    <div className="timeline">
      <i className="socrata-icon-edit" />
    </div>
    <div className="activity-info">
      <p>
        <span className="created-by">{creator(item.outputSchema)}</span>&nbsp;
        changed the&nbsp;
        <Link to={Links.showOutputSchema(item.upload.id, item.inputSchema.id, item.outputSchema.id)}>
          schema
        </Link>
      </p>
      <ActivityFeedTimestamp date={at} />
    </div>
  </div>);
};

const upsertActivity = (upsert, at) => {
  const key = `upsert-${upsert.id}`;
  return (<div key={key} className="activity upsert-in-progress">
    <div className="timeline">
      <i className="socrata-icon-dataset" />
    </div>
    <div className="activity-info">
      <p>
        <span className="created-by">{creator(upsert)}</span>&nbsp;
        started an upsert
      </p>
      <ActivityFeedTimestamp date={at} />
    </div>
  </div>);
};


const upsertCompletedActivity = (upsert, at) => {
  const key = `completed-upsert-${upsert.id}`;
  return (<div key={key} className="activity upsert-complete">
    <div className="timeline">
      <i className="socrata-icon-checkmark3" />
    </div>
    <div className="activity-info">
      <p>
        Data processing successfully finished
      </p>
      <ActivityFeedTimestamp date={at} />
    </div>
  </div>);
};

const upsertFailedActivity = (upsert, at) => {
  const key = `failed-upsert-${upsert.id}`;
  return (<div key={key} className="activity upsert-failed">
    <div className="timeline">
      <i className="socrata-icon-failed" />
    </div>
    <div className="activity-info">
      <p>
        Data processing failed
      </p>
      <ActivityFeedTimestamp date={at} />
    </div>
  </div>);
};

function activitiesOf(db) {
  const updateModel = db.updates[0];
  if (!updateModel) return [];
  const update = {
    type: 'update',
    value: updateModel,
    at: updateModel.inserted_at
  };
  const uploads = db.uploads.map((upload) => ({
    type: 'upload',
    value: upload,
    at: upload.inserted_at
  }));
  const outputSchemas = (db.output_schemas || []).map((outputSchema) => {
    const inputSchema = _.find(db.input_schemas, { id: outputSchema.input_schema_id });
    const upload = _.find(db.uploads, { id: inputSchema.upload_id });
    return {
      type: 'outputSchema',
      at: outputSchema.inserted_at,
      value: {
        outputSchema,
        inputSchema,
        upload
      }
    };
  });
  const upserts = db.upsert_jobs.map((upsertJob) => ({
    type: 'upsert',
    value: upsertJob,
    at: upsertJob.inserted_at
  }));

  // TODO: Encapsulate upsert job statuses ARGHGHGHghghghghghgGhghg
  const finishedUpserts = db.upsert_jobs.
    filter((upsertJob) => !!upsertJob.finished_at).
    filter((upsertJob) => upsertJob.status === 'successful').
    map((upsertJob) => ({
      type: 'upsertCompleted',
      value: upsertJob,
      at: upsertJob.finished_at
    })
  );

  const failedUpserts = db.upsert_jobs.
    filter((upsertJob) => !!upsertJob.finished_at).
    filter((upsertJob) => upsertJob.status === 'failure').
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
  return _.sortBy(items, 'at').map(toView);
}

function ActivityFeed({ db }) {
  const items = activitiesOf(db);
  return (
    <div className="activity-feed">
      {items}
    </div>
  );
}

ActivityFeed.propTypes = {
  routing: PropTypes.object.isRequired,
  db: PropTypes.object.isRequired
};

const mapStateToProps = ({ db, routing }) => {
  return ({ routing, db });
};

export default connect(mapStateToProps)(ActivityFeed);
