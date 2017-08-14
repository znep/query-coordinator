import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { browserHistory, Link } from 'react-router';
import { InfoPane } from 'common/components';
import MetadataTable from '../../../common/components/MetadataTable';
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

export function ShowRevision({ view, params, entities, createUpload, pushToEditMetadata }) {
  let metadataSection;
  const paneProps = {
    name: view.name,
    description: view.description,
    category: view.category
  };

  // MetadataTable component doesn't distinguish between private and non-private
  // custom metadata. So we have to do some data-massaging here before passing
  // custom metadata info to it.
  const privateCustomMetadata = _.get(view, 'privateMetadata.custom_fields', {});

  const nonPrivateCustomMetadata = _.get(view, 'metadata.custom_fields', {});

  const combinedCustomMetadata = _.merge(nonPrivateCustomMetadata, privateCustomMetadata);

  const currentAvailableFields = view.customMetadataFields
    ? view.customMetadataFields.map(fieldset => fieldset.name)
    : [];

  // Have to perform this check in case user deletes a field but we still have
  // data for it.
  const customMetadataFieldsets = _.pickBy(combinedCustomMetadata, (v, k) =>
    currentAvailableFields.includes(k)
  );

  const tableProps = {
    view: {
      ...view,
      tags: view.tags,
      attribution: view.attribution,
      attributionLink: '',
      attachments: view.attachments, // MetadataTable transforms this
      licenseName: view.license.name,
      licenseLogo: view.license.logoUrl,
      licenseUrl: view.license.termsLink,
      editMetadataUrl: '#',
      statsUrl: '', // MetadataTable computes this because permission checking
      disableContactDatasetOwner: true, // looks up a CurrentDomain feature whatever that is
      lastUpdatedAt: view.lastUpdatedAt,
      dataLastUpdatedAt: view.dataLastUpdatedAt,
      metadataLastUpdatedAt: view.metadataLastUpdatedAt,
      createdAt: view.createdAt,
      viewCount: view.viewCount,
      downloadCount: view.downloadCount,
      ownerName: view.owner.displayName // owner.name
    },
    customMetadataFieldsets,
    onClickEditMetadata: e => {
      e.preventDefault();
      pushToEditMetadata(Links.metadata(params));
    }
  };

  metadataSection = (
    <div className={styles.metadataContainer}>
      <div className={styles.infoPaneContainer}>
        <InfoPane {...paneProps} />
      </div>
      <MetadataTable {...tableProps} />
    </div>
  );

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
        {metadataSection}
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
  createUpload: PropTypes.func.isRequired,
  pushToEditMetadata: PropTypes.func.isRequired
};

function mapDispatchToProps(dispatch) {
  return {
    createUpload: (file, params) => {
      dispatch(Actions.createUpload(file, params));
    },
    pushToEditMetadata: url => browserHistory.push(url)
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
