import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { Link } from 'react-router';
import MetadataTable from 'containers/MetadataTableContainer';
import SchemaPreview from 'containers/SchemaPreviewContainer';
import HomePaneSidebar from 'containers/HomePaneSidebarContainer';
import DatasetPreview from 'containers/DatasetPreviewContainer';
import NotifyButton from 'containers/NotifyButtonContainer';
import RowDetails from 'containers/RowDetailsContainer';
import * as Links from 'links';
import * as Selectors from 'selectors';
import * as Actions from 'reduxStuff/actions/manageUploads';
import * as ApplyRevision from 'reduxStuff/actions/applyRevision';
import { enabledFileExtensions, formatExpanation } from 'lib/fileExtensions';
import styles from './ShowRevision.scss';

const noDataYetView = (createUpload, params) => {
  return (
    <div className={styles.tableInfo}>
      <h3 className={styles.previewAreaHeader}>
        {I18n.home_pane.no_data_yet}
      </h3>
      <p>
        {I18n.home_pane.adding_data_is_easy_and_fun}
      </p>

      <label id="source-label" className={styles.sourceButton} htmlFor="file">
        {I18n.manage_uploads.new_file}&nbsp;
      </label>
      <input
        id="file"
        name="file"
        type="file"
        accept={enabledFileExtensions.join(',')}
        aria-labelledby="source-label"
        onChange={evt => createUpload(evt.target.files[0], params)} />

      <p className={styles.fileTypes}>
        {I18n.home_pane.supported_uploads} {enabledFileExtensions.map(formatExpanation).join(', ')}
      </p>
    </div>
  );
};

const outputSchemaView = (entities, outputSchema, params) => {
  const inputSchema = _.find(entities.input_schemas, { id: outputSchema.input_schema_id });
  if (!inputSchema) return;
  return (
    <div className={styles.tableInfo}>
      <h3 className={styles.previewAreaHeader}>
        {I18n.home_pane.data_uploaded}
      </h3>
      <p>
        {I18n.home_pane.data_uploaded_blurb}
      </p>
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

const upsertInProgressView = () => {
  return (
    <div className={styles.tableInfo}>
      <h3 className={styles.previewAreaHeader}>
        {I18n.home_pane.being_processed}
      </h3>
      <p>
        {I18n.home_pane.being_processed_detail}
      </p>
      <div>
        <NotifyButton />
      </div>
    </div>
  );
};

// WRAPPER COMPONENT
const WrapDataTablePlaceholder = ({ upsertExists, outputSchema, entities, createUpload, params }) => {
  let child;

  if (upsertExists) {
    child = upsertInProgressView(entities);
  } else if (outputSchema) {
    child = outputSchemaView(entities, outputSchema, params);
  } else {
    child = noDataYetView(createUpload, params);
  }

  return (
    <div className={styles.resultCard}>
      {child}
    </div>
  );
};

WrapDataTablePlaceholder.propTypes = {
  upsertExists: PropTypes.number.isRequired,
  outputSchema: PropTypes.object,
  entities: PropTypes.object,
  createUpload: PropTypes.func,
  params: PropTypes.object.isRequired
};

function upsertCompleteView(view, outputSchema) {
  return (
    <div key="upsertCompleteView">
      <DatasetPreview view={view} outputSchema={outputSchema} />
    </div>
  );
}

export function ShowRevision({ view, params, entities, createUpload }) {
  const outputSchema = Selectors.currentOutputSchema(entities);
  const doesUpsertExist = _.size(
    _.filter(entities.task_sets, uj => uj.status !== ApplyRevision.TASK_SET_FAILURE)
  );
  const isUpsertComplete =
    doesUpsertExist &&
    _.map(entities.task_sets, uj => uj.status === ApplyRevision.TASK_SET_SUCCESSFUL).reduce(
      (acc, success) => success || acc,
      false
    );

  let dataTable;
  if (isUpsertComplete) {
    if (outputSchema) {
      const inputSchema = _.find(entities.input_schemas, { id: outputSchema.input_schema_id });
      dataTable = [
        <Link
          key="manage-data-button"
          to={Links.showOutputSchema(params, inputSchema.source_id, inputSchema.id, outputSchema.id)}
          className={styles.manageDataLink}>
          <button className={styles.manageDataBtn} tabIndex="-1">
            {I18n.home_pane.data_manage_button}
          </button>
        </Link>,
        upsertCompleteView(view, outputSchema)
      ];
    } else {
      dataTable = (
        <WrapDataTablePlaceholder
          upsertExists={doesUpsertExist}
          outputSchema={null}
          entities={entities}
          params={params}
          createUpload={createUpload} />
      );
    }
  } else {
    dataTable = (
      <WrapDataTablePlaceholder
        upsertExists={doesUpsertExist}
        outputSchema={outputSchema}
        entities={entities}
        params={params}
        createUpload={createUpload} />
    );
  }

  return (
    <div className={styles.homeContainer}>
      <div className={styles.homeContent}>
        <MetadataTable />
        <div className={styles.schemaPreviewContainer}>
          <SchemaPreview />
          <RowDetails />
        </div>

        <section className={styles.tableContainer}>
          <h2 className={styles.header}>
            {I18n.home_pane.table_preview}
          </h2>

          {dataTable}
        </section>
      </div>
      <HomePaneSidebar />
    </div>
  );
}

ShowRevision.propTypes = {
  view: PropTypes.object.isRequired,
  params: PropTypes.object.isRequired,
  entities: PropTypes.object.isRequired,
  createUpload: PropTypes.func.isRequired
};

function mapDispatchToProps(dispatch) {
  return {
    createUpload: (file, params) => {
      dispatch(Actions.createUpload(file, params));
    }
  };
}

function mapStateToProps(state, { params }) {
  return {
    view: _.values(state.entities.views)[0],
    entities: state.entities,
    params
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowRevision);
