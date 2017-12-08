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

// COMPONENT VIEWS
const NoDataYetView = ({ params }) => (
  <section className={styles.tableContainer}>
    <div className={styles.headerWrapper}>
      <h2 className={styles.header}>{I18n.home_pane.table_preview}</h2>
      <div className="button-group">
        <Link to={Links.sources(params)} className="btn btn-sm btn-default btn-alternate-2">
          <span className="socrata-icon-plus2" /> {I18n.home_pane.add_data}
        </Link>
      </div>
    </div>
    <div className={styles.resultCard}>
      <div className={styles.tableInfo}>
        <h3 className={styles.previewAreaHeader}>{I18n.home_pane.no_data_yet}</h3>
        <p>{I18n.home_pane.adding_data_is_easy_and_fun}</p>
      </div>
    </div>
  </section>
);

NoDataYetView.propTypes = {
  params: PropTypes.object.isRequired
};

const HrefView = ({ params }) => (
  <section className={styles.tableContainer}>
    <div className={styles.headerWrapper}>
      <h2 className={styles.header}>{I18n.home_pane.table_preview}</h2>
      <div className="button-group">
        <Link to={Links.hrefSource(params)} className="btn btn-sm btn-default btn-alternate-2">
          <span className="socrata-icon-eye" /> {I18n.home_pane.href_view_btn}
        </Link>
      </div>
    </div>
    <div className={styles.resultCard}>
      <div className={styles.tableInfo}>
        <h3 className={styles.previewAreaHeader}>{I18n.home_pane.href_header}</h3>
        <p>{I18n.home_pane.href_message}</p>
      </div>
    </div>
  </section>
);

HrefView.propTypes = {
  params: PropTypes.object.isRequired
};

const PreviewDataView = ({ entities, outputSchema, blob, params }) => {
  let previewDataPath;
  if (outputSchema) {
    const inputSchema = _.find(entities.input_schemas, { id: outputSchema.input_schema_id });
    if (!inputSchema) return;
    previewDataPath = Links.showOutputSchema(params, inputSchema.source_id, inputSchema.id, outputSchema.id);
  } else if (blob) {
    previewDataPath = Links.showBlobPreview(params, blob.id);
  } else {
    return;
  }

  return (
    <section className={styles.tableContainer}>
      <div className={styles.headerWrapper}>
        <h2 className={styles.header}>{I18n.home_pane.table_preview}</h2>
        <div className="button-group">
          <Link to={previewDataPath}>
            <button className="btn btn-sm btn-default btn-alternate-2" tabIndex="-1">
              {I18n.home_pane.review_data}
            </button>
          </Link>
        </div>
      </div>
      <div className={styles.resultCard}>
        <div className={styles.tableInfo}>
          <h3 className={styles.previewAreaHeader}>{I18n.home_pane.data_uploaded}</h3>
          <p>{I18n.home_pane.data_uploaded_blurb}</p>
        </div>
      </div>
    </section>
  );
};

PreviewDataView.propTypes = {
  entities: PropTypes.object.isRequired,
  outputSchema: PropTypes.object,
  blob: PropTypes.object,
  params: PropTypes.object.isRequired
};

const UpsertInProgressView = () => (
  <section className={styles.tableContainer}>
    <div className={styles.headerWrapper}>
      <h2 className={styles.header}>{I18n.home_pane.table_preview}</h2>
      <div className="button-group">
        <NotifyButton />
      </div>
    </div>
    <div className={styles.resultCard}>
      <div className={styles.tableInfo}>
        <h3 className={styles.previewAreaHeader}>{I18n.home_pane.being_processed}</h3>
        <p>{I18n.home_pane.being_processed_detail}</p>
      </div>
    </div>
  </section>
);

const UpsertCompleteView = ({ view, outputSchema }) => (
  <section className={styles.tableContainer}>
    <div className={styles.headerWrapper}>
      <h2 className={styles.header}>{I18n.home_pane.table_preview}</h2>
    </div>
    <div className={styles.resultCard}>
      <div key="upsertCompleteView">
        <DatasetPreview view={view} outputSchema={outputSchema} />
      </div>
    </div>
  </section>
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
  const blob = Selectors.currentBlobSource(entities, revisionSeq);
  const hrefExists = !!Selectors.currentRevision(entities, revisionSeq).href.length;

  if (tasksExist && allTasksSucceeded && os) {
    child = <UpsertCompleteView view={view} outputSchema={os} />;
  } else if (tasksExist && !allTasksSucceeded && os) {
    child = <UpsertInProgressView />;
  } else if (!tasksExist && (os || blob)) {
    child = <PreviewDataView entities={entities} outputSchema={os} blob={blob} params={params} />;
  } else if (hrefExists) {
    child = <HrefView params={params} />;
  } else {
    child = <NoDataYetView params={params} />;
  }

  return child;
};

TablePreview.propTypes = {
  entities: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  view: PropTypes.object.isRequired
};

export default TablePreview;
