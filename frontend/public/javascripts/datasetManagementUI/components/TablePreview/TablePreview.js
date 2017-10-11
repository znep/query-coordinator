import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router';
import NotifyButton from 'containers/NotifyButtonContainer';
import * as Links from 'links/links';
import DatasetPreview from 'containers/DatasetPreviewContainer';
import * as Selectors from 'selectors';
import * as ApplyRevision from 'reduxStuff/actions/applyRevision';
import styles from './TablePreview.scss';

// <label id="source-label" className={styles.uploadButton} htmlFor="file">
//   {I18n.manage_uploads.new_file}&nbsp;
// </label>
// <ImportFromURLButton params={params} />
// <input
//   id="file"
//   name="file"
//   type="file"
//   accept={enabledFileExtensions.join(',')}
//   aria-labelledby="source-label"
//   onChange={evt => createUpload(evt.target.files[0], params)} />
//
// <p className={styles.fileTypes}>
//   {I18n.home_pane.supported_uploads} {enabledFileExtensions.map(formatExpanation).join(', ')}
// </p>

// COMPONENT VIEWS
const NoDataYetView = ({ params }) => (
  <div className={styles.tableInfo}>
    <h3 className={styles.previewAreaHeader}>{I18n.home_pane.no_data_yet}</h3>
    <p>{I18n.home_pane.adding_data_is_easy_and_fun}</p>
    <Link to={Links.sources(params)} className={styles.dataLink}>
      {I18n.home_pane.add_data}
    </Link>
  </div>
);

NoDataYetView.propTypes = {
  params: PropTypes.object.isRequired
};

const OutputSchemaView = ({ entities, outputSchema, params }) => {
  const inputSchema = _.find(entities.input_schemas, { id: outputSchema.input_schema_id });
  if (!inputSchema) return;
  return (
    <div className={styles.tableInfo}>
      <h3 className={styles.previewAreaHeader}>{I18n.home_pane.data_uploaded}</h3>
      <p>{I18n.home_pane.data_uploaded_blurb}</p>
      <p>
        <Link to={Links.showOutputSchema(params, inputSchema.source_id, inputSchema.id, outputSchema.id)}>
          <button className={styles.reviewBtn} tabIndex="-1">
            {I18n.home_pane.review_data}
          </button>
        </Link>
      </p>
    </div>
  );
};

OutputSchemaView.propTypes = {
  entities: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired
};

const UpsertInProgressView = () => (
  <div className={styles.tableInfo}>
    <h3 className={styles.previewAreaHeader}>{I18n.home_pane.being_processed}</h3>
    <p>{I18n.home_pane.being_processed_detail}</p>
    <div>
      <NotifyButton />
    </div>
  </div>
);

const UpsertCompleteView = ({ view, outputSchema }) => (
  <div key="upsertCompleteView">
    <DatasetPreview view={view} outputSchema={outputSchema} />
  </div>
);

UpsertCompleteView.propTypes = {
  view: PropTypes.object.isRequired,
  outputSchema: PropTypes.object.isRequired
};

// HELPER FUNCTIONS
const numberOfTasks = _.flowRight(_.size, _.filter);

const doTasksExist = entities =>
  numberOfTasks(entities.task_sets, uj => uj.status !== ApplyRevision.TASK_SET_FAILURE) > 0;

const haveAllTasksSucceeded = entities =>
  _.map(entities.task_sets, uj => uj.status === ApplyRevision.TASK_SET_SUCCESSFUL).reduce(
    (acc, success) => success || acc,
    false
  );

// MAIN COMPONENT
const TablePreview = ({ entities, params, view }) => {
  let child;
  const tasksExist = doTasksExist(entities);
  const allTasksSucceeded = haveAllTasksSucceeded(entities);
  const revisionSeq = _.toNumber(params.revisionSeq);
  const os = Selectors.currentOutputSchema(entities, revisionSeq);
  if (tasksExist && allTasksSucceeded && os) {
    child = <UpsertCompleteView view={view} outputSchema={os} />;
  } else if (tasksExist && !allTasksSucceeded && os) {
    child = <UpsertInProgressView />;
  } else if (!tasksExist && os) {
    child = <OutputSchemaView entities={entities} outputSchema={os} params={params} />;
  } else {
    child = <NoDataYetView params={params} />;
  }

  return <div className={styles.resultCard}>{child}</div>;
};

TablePreview.propTypes = {
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  view: PropTypes.object.isRequired
};

export default TablePreview;
