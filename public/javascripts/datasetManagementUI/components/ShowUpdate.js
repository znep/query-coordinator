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

function wrapEmpty(result) {
  return (
    <div className="result-card">
      <div className="entry-header"></div>
      <div className="entry-main data-table">
        {result}
      </div>
    </div>
  );
}

function noDataYetView() {
  return wrapEmpty(
    <div className="entry-description table-info">
      <h6>
        {I18n.home_pane.no_data_yet}
      </h6>
      <p>
        {I18n.home_pane.adding_data_is_easy_and_fun}
      </p>

      <Link to={Links.uploads}>
        <button
          className="no-data-yet-btn btn btn-sm btn-alternate-2"
          tabIndex="-1">
          {I18n.home_pane.data_manage_button}
        </button>
      </Link>

      <p className="small">{I18n.home_pane.supported_uploads}</p>
    </div>
  );
}

function outputSchemaView(db, outputSchema) {
  const inputSchema = _.find(db.input_schemas, { id: outputSchema.input_schema_id });
  if (!inputSchema) return;
  return wrapEmpty(
    <div className="entry-description table-info view-output-schema">
      <h6>{I18n.home_pane.data_uploaded}</h6>
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

function upsertInProgressView() {
  return wrapEmpty(
    <div className="entry-description table-info upsert-in-progress">
      <h6>{I18n.home_pane.being_processed}</h6>
      <p>
        There will be a notify me button here at some point
      </p>
    </div>
  );
}

function upsertCompleteView(view, outputSchema) {
  return (
    <div className="table-preview">
      <DatasetPreview view={view} outputSchema={outputSchema} />
    </div>
  );
}

function ShowUpdate({ view, routing, db }) {
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
  const doesUpsertExist = db.upsert_jobs && db.upsert_jobs.length > 0;
  // TODO: hardcoded status here is nasty - this should be encapsulated in the upsert job itself
  const isUpsertComplete = doesUpsertExist && db.upsert_jobs.
    map(uj => uj.status === 'successful').
    reduce((acc, success) => success || acc, false);

  var dataTable;
  if (isUpsertComplete) {
    dataTable = upsertCompleteView(view, outputSchema);
  } else if (doesUpsertExist) {
    dataTable = upsertInProgressView();
  } else if (outputSchema) {
    dataTable = outputSchemaView(db, outputSchema);
  } else {
    dataTable = noDataYetView();
  }

  return (
    <div id="home-pane">
      <div className="home-content container">
        {metadataSection}
        <SchemaPreview db={db} />

        <section className="management-ui-section table-preview">
          <h2>{I18n.home_pane.table_preview}</h2>
          {dataTable}
        </section>
      </div>
      <HomePaneSidebar />
    </div>
  );
}

ShowUpdate.propTypes = {
  view: PropTypes.object.isRequired,
  routing: PropTypes.object.isRequired,
  db: PropTypes.object.isRequired
};

const mapStateToProps = (state) => {
  return ({
    view: state.db.views[0],
    routing: state.routing,
    db: state.db
  });
};

export default connect(mapStateToProps)(ShowUpdate);
