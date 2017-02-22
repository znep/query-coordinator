import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import * as Links from '../links';
import * as Selectors from '../selectors';
import classNames from 'classnames';
import ActivityFeed from './ActivityFeed';

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

function manageData(state) { // can't destructure in the function head because the linter explodes???
  const { db } = state;

  const { hasMetadata, hasData, anyColumnHasDescription } = query(db);

  const doneCheckmark = <i className="finished socrata-icon-checkmark-alt" />;
  const dataDoneCheckmark = hasData ? doneCheckmark : null;
  const metadataDoneCheckmark = hasMetadata ? doneCheckmark : null;
  const columnMetadataDoneCheckmark = anyColumnHasDescription ? doneCheckmark : null;

  return (
    <div className="manage-data">
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

function MetadataSidebar(state) {
  const { urlParams } = state;
  const showLog = urlParams.sidebarSelection === 'log';
  const contents = showLog ? (<ActivityFeed />) : manageData(state);


  return (
    <div className="metadata-sidebar">
      <div className="sidebar-chooser">
        <Link to={Links.home}>
          <button className={classNames('btn', 'chooser-btn', { 'enabled': !showLog })}>
            Manage Data
          </button>
        </Link>
        <Link to={Links.activityLog}>
          <button className={classNames('btn', 'chooser-btn', { 'enabled': showLog })}>
            Activity Log
          </button>
        </Link>
      </div>
      {contents}
    </div>
  );
}

MetadataSidebar.propTypes = {
  routing: PropTypes.object.isRequired,
  db: PropTypes.object.isRequired,
  urlParams: PropTypes.object.isRequired
};

const mapStateToProps = ({ db, routing }, { urlParams }) => {
  return { routing, db, urlParams };
};

export default connect(mapStateToProps)(MetadataSidebar);
