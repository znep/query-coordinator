import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import * as Links from '../links';

function query(db) {
  return {
    hasMetadata: !!(db.views[0] && db.views[0].description), // TODO: do we want to have this be more strict?
    hasData: (db.uploads.length > 0),
    hasColumnMetadata: true // TODO: this
  };
}

function MetadataSidebar({ routing, db }) {
  const { hasMetadata, hasData, hasColumnMetadata } = query(db);

  const done = <i className="finished socrata-icon-checkmark-alt" />;

  let dataDone = hasData ? done : null;

  let metadataDone = hasMetadata ? done : null;

  // TODO: column metadata isn't yet implemented
  let columnMetadataDone = hasColumnMetadata ? done : null;

  return (
    <div className="metadata-sidebar">
      <h4>{I18n.home_pane.getting_started}</h4>
      <p className="small how-to-publish-blurb"> {I18n.home_pane.publishing_data_is_easy_and_fun} </p>

      <div className="next-step">
        <i className="socrata-icon-data" />
        {dataDone}

        <h3> {I18n.home_pane.adding_data} </h3>
        <p className="small"> {I18n.home_pane.adding_data_blurb} </p>
        <Link to={Links.uploads}>
          <button
            className="btn btn-sm btn-alternate-2"
            tabIndex="-1">
            {I18n.home_pane.data_manage_button}
          </button>
        </Link>
      </div>
      <div className="next-step">
        <i className="socrata-icon-edit" />
        {metadataDone}
        <h3> {I18n.home_pane.adding_metadata} </h3>
        <p className="small">
          {I18n.home_pane.adding_metadata_blurb}
        </p>
        <Link to={Links.metadata(routing)}>
          <button
            className="btn btn-sm btn-alternate-2"
            tabIndex="-2">
            {I18n.home_pane.metadata_manage_button}
          </button>
        </Link>
      </div>
      <div className="next-step">
        <i className="socrata-icon-list2" />
        {columnMetadataDone}
        <h3> {I18n.home_pane.add_column_metadata} </h3>
        <p className="small">
          {I18n.home_pane.add_column_metadata_blurb}
        </p>
        <Link to={Links.metadata(routing)}>
          <button
            className="btn btn-sm btn-alternate-2"
            tabIndex="-2">
            {I18n.home_pane.column_metadata_manage_button}
          </button>
        </Link>
      </div>
    </div>
  );
}

MetadataSidebar.propTypes = {
  routing: PropTypes.object.isRequired,
  db: PropTypes.object.isRequired
};

const mapStateToProps = ({ db, routing }) => ({ routing, db });

export default connect(mapStateToProps)(MetadataSidebar);
