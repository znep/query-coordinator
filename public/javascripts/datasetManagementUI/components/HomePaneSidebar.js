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

function HomePaneSidebar({ db }) {
  const { anyColumnHasDescription } = query(db);

  const doneCheckmark = <span className="finished socrata-icon-checkmark-alt" />;
  const columnDescriptionCheckmark = anyColumnHasDescription ? doneCheckmark : null;

  // TODO: Handle features and visualizations.
  const visualizationDoneCheckmark = null;
  const featuredDoneCheckmark = null;

  return (
    <div id="home-pane-sidebar">
      <h3>{I18n.home_pane.sidebar.title}</h3>
      <p className="small sidebar-blurb"> {I18n.home_pane.sidebar.blurb} </p>

      <div>
        <span className="icon socrata-icon-column-info" />
        {columnDescriptionCheckmark}

        <h4>{I18n.home_pane.sidebar.column_descriptions}</h4>
        <p> {I18n.home_pane.sidebar.column_descriptions_blurb} </p>
        <Link to={Links.columnMetadataEditor()}>
          <button
            className="btn btn-sm btn-alternate-2"
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
          className="btn btn-sm btn-alternate-2"
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
          className="btn btn-sm btn-alternate-2"
          disabled
          tabIndex="-1">
          {I18n.home_pane.sidebar.feature_button}
        </button>
      </div>
    </div>
  );
}

HomePaneSidebar.propTypes = {
  db: PropTypes.object.isRequired
};

const mapStateToProps = ({ db }) => ({ db });

export default connect(mapStateToProps)(HomePaneSidebar);
