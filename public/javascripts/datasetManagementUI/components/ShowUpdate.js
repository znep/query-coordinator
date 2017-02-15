import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import { InfoPane } from 'socrata-components';
import MetadataTable from '../../common/components/MetadataTable';
import SchemaPreview from './SchemaPreview';
import MetadataSidebar from './MetadataSidebar';
import * as Links from '../links';

export function ShowUpdate({ view, routing, db }) {
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
  return (
    <div id="home-pane">
      <div className="home-content container">
        {metadataSection}
        <SchemaPreview db={db} />

        <section className="management-ui-section">
          <h2>{I18n.home_pane.data}</h2>
          <div className="alert default manage-section-box">
            {I18n.home_pane.data_blurb}
          </div>
        </section>
      </div>

      <MetadataSidebar />
    </div>
  );
}

ShowUpdate.propTypes = {
  view: PropTypes.object.isRequired,
  routing: PropTypes.object.isRequired,
  db: PropTypes.object.isRequired
};

const mapStateToProps = (state) => ({
  view: state.db.views[0],
  routing: state.routing,
  db: state.db
});

export default connect(mapStateToProps)(ShowUpdate);
