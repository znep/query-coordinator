import _ from 'lodash';
import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { InfoPane } from 'socrata-components';
import MetadataTable from '../../common/components/MetadataTable';
import SchemaPreview from './SchemaPreview';
import HomePaneSidebar from './HomePaneSidebar';
import DatasetPreview from './DatasetPreview';
import * as Links from '../links';
import { Link } from 'react-router';
import { latestOutputSchema } from '../selectors';
import * as Actions from '../actions/manageUploads';
import * as ApplyUpdate from '../actions/applyUpdate';
import { STATUS_INSERTING, STATUS_SAVED } from '../lib/database/statuses';

function wrapDataTablePlaceholder(result) {
  return (
    <div className="result-card">
      <div className="entry-main data-table">
        {result}
      </div>
    </div>
  );
}

function noDataYetView(createUpload) {
  return wrapDataTablePlaceholder(
    <div className="entry-description table-info no-data-yet">
      <h3 className="h5">
        {I18n.home_pane.no_data_yet}
      </h3>
      <p>
        {I18n.home_pane.adding_data_is_easy_and_fun}
      </p>

      <label
        id="upload-label"
        className="btn btn-alternate-2"
        htmlFor="file">
        {I18n.manage_uploads.new_file}&nbsp;
      </label>
      <input
        id="file"
        name="file"
        type="file"
        aria-labelledby="upload-label"
        onChange={(evt) => (createUpload(evt.target.files[0]))} />

      <p className="small supported-file-types">
        {I18n.home_pane.supported_uploads}
      </p>
    </div>
  );
}

function outputSchemaView(db, outputSchema) {
  const inputSchema = _.find(db.input_schemas, { id: outputSchema.input_schema_id });
  if (!inputSchema) return;
  return wrapDataTablePlaceholder(
    <div className="entry-description table-info view-output-schema">
      <h3 className="h5">{I18n.home_pane.data_uploaded}</h3>
      <p>
        {I18n.home_pane.data_uploaded_blurb}
      </p>
      <p>
        <Link to={Links.showOutputSchema(inputSchema.upload_id, inputSchema.id, outputSchema.id)}>
          <button
            className="no-data-yet-btn btn btn-sm btn-alternate-2"
            tabIndex="-1">
            {I18n.home_pane.review_data}
          </button>
        </Link>
      </p>
    </div>
  );
}

function upsertInProgressView(db, addEmailInterest) {
  const upsertJob = _.find(db.upsert_jobs, { status: null });

  let notifyButton;
  if (upsertJob) {
    const upsertJobUuid = upsertJob.job_uuid;
    const emailInterest = _.find(db.email_interests, { job_uuid: upsertJobUuid });
    if (emailInterest) {
      if (emailInterest.__status__.type === STATUS_INSERTING) {
        notifyButton = (
          <button className="btn btn-primary btn-busy email-interest-btn">
            <span className="spinner-default spinner-btn-primary email-interest-spinner"></span>
          </button>
        );
      } else if (emailInterest.__status__.type === STATUS_SAVED) {
        notifyButton = (
          <button
            className="btn btn-success email-interest-btn">
            <span className="socrata-icon-checkmark3 email-success-check" />
            {I18n.home_pane.email_me_success}
          </button>
        );
      } else {
        notifyButton = (
          <button
            className="btn btn-error email-interest-btn">
            {I18n.home_pane.email_me_error}
          </button>
        );
      }
    } else {
      notifyButton = (
        <button
          className="btn btn-primary btn-inverse email-interest-btn"
          onClick={() => { addEmailInterest(upsertJobUuid); }}>
          {I18n.home_pane.email_me}
        </button>
      );
    }
  }

  return wrapDataTablePlaceholder(
    <div className="entry-description table-info upsert-in-progress">
      <h3 className="h6">{I18n.home_pane.being_processed}</h3>
      <p>{I18n.home_pane.being_processed_detail}</p>
      <div>{notifyButton}</div>
    </div>
  );
}

function upsertCompleteView(view, outputSchema) {
  return (
    <div className="table-preview" key="upsert-complete-view">
      <DatasetPreview view={view} outputSchema={outputSchema} />
    </div>
  );
}

function ShowUpdate({ view, routing, db, urlParams, addEmailInterest, createUpload }) {
  let metadataSection;
  const paneProps = {
    name: view.name,
    description: view.description,
    category: view.category
  };

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
      editMetadataUrl: Links.metadata(routing),
      statsUrl: '', // MetadataTable computes this because permission checking
      disableContactDatasetOwner: true, // looks up a CurrentDomain feature whatever that is
      lastUpdatedAt: view.lastUpdatedAt,
      dataLastUpdatedAt: view.dataLastUpdatedAt,
      metadataLastUpdatedAt: view.metadataLastUpdatedAt,
      createdAt: view.createdAt,
      viewCount: view.viewCount,
      downloadCount: view.downloadCount,
      ownerName: view.owner.displayName // owner.name
    }
  };

  metadataSection = (
    <div id="metadata-section">
      <div id="info-pane-container">
        <InfoPane {...paneProps} />
      </div>
      <MetadataTable {...tableProps} />
    </div>
  );

  const outputSchema = latestOutputSchema(db);
  const doesUpsertExist = _.size(db.upsert_jobs);
  // TODO: hardcoded status here is nasty - this should be encapsulated in the upsert job itself
  const isUpsertComplete = doesUpsertExist &&
    _.map(db.upsert_jobs, (uj) => uj.status === 'successful').
    reduce((acc, success) => success || acc, false);

  let dataTable;
  if (isUpsertComplete) {
    const inputSchema = _.find(db.input_schemas, { id: outputSchema.input_schema_id });
    dataTable = [(
      <Link
        to={Links.showOutputSchema(inputSchema.upload_id, inputSchema.id, outputSchema.id)}
        key={'manage-data-button'}
        className="header-btn-wrapper" >
        <button
          className="btn btn-sm btn-alternate-2"
          tabIndex="-1">
          {I18n.home_pane.data_manage_button}
        </button>
      </Link>),
      upsertCompleteView(view, outputSchema)];
  } else if (doesUpsertExist) {
    dataTable = upsertInProgressView(db, addEmailInterest);
  } else if (outputSchema) {
    dataTable = outputSchemaView(db, outputSchema);
  } else {
    dataTable = noDataYetView(createUpload);
  }

  return (
    <div id="home-pane">
      <div className="home-content container">
        {metadataSection}
        <SchemaPreview db={db} />

        <section className="management-ui-section table-preview">
          <h2 className="landing-page-section-header">{I18n.home_pane.table_preview}</h2>

          {dataTable}
        </section>
      </div>
      <HomePaneSidebar urlParams={urlParams} />
    </div>
  );
}

ShowUpdate.propTypes = {
  view: PropTypes.object.isRequired,
  routing: PropTypes.object.isRequired,
  db: PropTypes.object.isRequired,
  urlParams: PropTypes.object.isRequired,
  addEmailInterest: PropTypes.func.isRequired,
  createUpload: PropTypes.func.isRequired
};

function mapDispatchToProps(dispatch) {
  return {
    addEmailInterest: (jobUuid) => {
      dispatch(ApplyUpdate.addEmailInterest(jobUuid));
    },
    createUpload: (file) => {
      dispatch(Actions.createUpload(file));
    }
  };
}

function mapStateToProps(state, ownProps) {
  return {
    view: _.values(state.db.views)[0],
    routing: state.routing,
    db: state.db,
    urlParams: ownProps.params
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ShowUpdate);
