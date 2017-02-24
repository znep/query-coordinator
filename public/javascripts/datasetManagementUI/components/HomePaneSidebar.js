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
  const { anyColumnHasDescription } = query(db);

  const doneCheckmark = <span className="finished socrata-icon-checkmark-alt" />;
  const columnDescriptionCheckmark = anyColumnHasDescription ? doneCheckmark : null;

  // TODO: Handle features and visualizations.
  const visualizationDoneCheckmark = null;
  const featuredDoneCheckmark = null;

  return (
    <div id="home-pane-sidebar-data">
      <h4>{I18n.home_pane.sidebar.title}</h4>
      <p className="small sidebar-blurb"> {I18n.home_pane.sidebar.blurb} </p>

      <div>
        <span className="icon socrata-icon-column-info" />
        {columnDescriptionCheckmark}

        <h3>{I18n.home_pane.sidebar.column_descriptions}</h3>
        <p> {I18n.home_pane.sidebar.column_descriptions_blurb} </p>
        <Link to={Links.columnMetadataEditor()}>
          <button
            className="btn btn-sm btn-default"
            tabIndex="-1">
            {I18n.home_pane.sidebar.column_descriptions_button}
          </button>
        </Link>
      </div>

      <div>
        <span className="icon socrata-icon-cards" />
        {visualizationDoneCheckmark}
        <h3>{I18n.home_pane.sidebar.visualize}</h3>
        <p>
          {I18n.home_pane.sidebar.visualize_blurb}
        </p>
        <button
          className="btn btn-sm btn-default btn-disabled-lite"
          disabled
          tabIndex="-1">
          {I18n.home_pane.sidebar.visualize_button}
        </button>
      </div>

      <div>
        <span className="icon socrata-icon-featured" />
        {featuredDoneCheckmark}
        <h3>{I18n.home_pane.sidebar.feature}</h3>
        <p>
          {I18n.home_pane.sidebar.feature_blurb}
        </p>

        <button
          className="btn btn-sm btn-default btn-disabled-lite"
          disabled
          tabIndex="-1">
          {I18n.home_pane.sidebar.feature_button}
        </button>
      </div>
    </div>
  );
}

function HomePaneSidebar(state) {
  const { urlParams } = state;
  const showLog = urlParams.sidebarSelection === 'log';
  const contents = showLog ? (<ActivityFeed />) : manageData(state);


  return (
    <div id="home-pane-sidebar">
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

HomePaneSidebar.propTypes = {
  routing: PropTypes.object.isRequired,
  db: PropTypes.object.isRequired,
  urlParams: PropTypes.object.isRequired
};

const mapStateToProps = ({ db, routing }, { urlParams }) => {
  return { routing, db, urlParams };
};

export default connect(mapStateToProps)(HomePaneSidebar);
