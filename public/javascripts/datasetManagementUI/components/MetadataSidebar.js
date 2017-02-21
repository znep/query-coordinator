import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import * as Links from '../links';
import * as Selectors from '../selectors';

function query(db) {
  const currentOutputSchema = Selectors.currentOutputSchema(db);
  const outputColumns = currentOutputSchema ?
    Selectors.columnsForOutputSchema(db, currentOutputSchema.id) :
    [];
  return {
    hasMetadata: !!(db.views[0].description), // TODO: do we want to have this be more strict?
    hasData: db.uploads.length > 0,
    anyColumnHasDescription: outputColumns.some((outputColumn) => (outputColumn.description))
  };
}

function MetadataSidebar({ db }) {
  const { hasMetadata, hasData, anyColumnHasDescription } = query(db);

  const doneCheckmark = <i className="finished socrata-icon-checkmark-alt" />;
  const dataDoneCheckmark = hasData ? doneCheckmark : null;
  const metadataDoneCheckmark = hasMetadata ? doneCheckmark : null;
  const columnMetadataDoneCheckmark = anyColumnHasDescription ? doneCheckmark : null;

  return (
    <div className="metadata-sidebar">
      <h4>{I18n.home_pane.getting_started}</h4>
      <p className="small how-to-publish-blurb"> {I18n.home_pane.publishing_data_is_easy_and_fun} </p>

      <div className="next-step">
        <i className="socrata-icon-data" />
        {dataDoneCheckmark}

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
        {metadataDoneCheckmark}
        <h3> {I18n.home_pane.adding_metadata} </h3>
        <p className="small">
          {I18n.home_pane.adding_metadata_blurb}
        </p>
        <Link to={Links.metadata}>
          <button
            className="btn btn-sm btn-alternate-2"
            tabIndex="-2">
            {I18n.home_pane.metadata_manage_button}
          </button>
        </Link>
      </div>
      <div className="next-step">
        <i className="socrata-icon-list2" />
        {columnMetadataDoneCheckmark}
        <h3> {I18n.home_pane.add_column_metadata} </h3>
        <p className="small">
          {I18n.home_pane.add_column_metadata_blurb}
        </p>
        <Link to={Links.columnMetadataEditor()}>
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
  db: PropTypes.object.isRequired
};

const mapStateToProps = ({ db }) => ({ db });

export default connect(mapStateToProps)(MetadataSidebar);
