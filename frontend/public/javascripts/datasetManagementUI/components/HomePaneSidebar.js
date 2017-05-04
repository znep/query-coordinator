import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import * as Links from '../links';
import * as Selectors from '../selectors';
import ActivityFeed from './ActivityFeed';
import SocrataIcon from '../../common/components/SocrataIcon';
import styles from 'styles/HomePaneSidebar.scss';

function query(db) {
  const currentOutputSchema = Selectors.latestOutputSchema(db);
  const outputColumns = currentOutputSchema ?
    Selectors.columnsForOutputSchema(db, currentOutputSchema.id) :
    [];
  return {
    hasMetadata: !!(_.values(db.views)[0].description), // TODO: do we want to have this be more strict?
    hasData: db.uploads.length > 0,
    anyColumnHasDescription: outputColumns.some((outputColumn) => (outputColumn.description))
  };
}

export const ManageData = (props) => {
  const { db, columnsExist } = props;
  const { anyColumnHasDescription } = query(db);

  const doneCheckmark = <SocrataIcon name="checkmark-alt" className={styles.icon} />;
  const columnDescriptionCheckmark = anyColumnHasDescription ? doneCheckmark : null;

  // TODO: Handle features and visualizations.
  const visualizationDoneCheckmark = null;
  const featuredDoneCheckmark = null;

  return (
    <div className={styles.sidebarData}>
      <div>
        <SocrataIcon name="column-info" className={styles.icon} />
        {columnDescriptionCheckmark}

        <h3>{I18n.home_pane.sidebar.column_descriptions}</h3>
        <p> {I18n.home_pane.sidebar.column_descriptions_blurb} </p>
        <Link to={Links.columnMetadataForm()}>
          <button
            className={columnsExist ? styles.sidebarBtn : styles.sidebarBtnDisabled}
            title={!columnsExist && I18n.home_pane.sidebar.no_columns_msg}
            disabled={!columnsExist}
            tabIndex="-1">
            {I18n.home_pane.sidebar.column_descriptions_button}
          </button>
        </Link>
      </div>

      <div>
        <SocrataIcon name="cards" className={styles.icon} />
        {visualizationDoneCheckmark}
        <h3>{I18n.home_pane.sidebar.visualize}</h3>
        <p>
          {I18n.home_pane.sidebar.visualize_blurb}
        </p>
        <button
          className={styles.sidebarBtnDisabled}
          disabled
          tabIndex="-1">
          {I18n.home_pane.sidebar.visualize_button}
        </button>
      </div>

      <div>
        <SocrataIcon name="featured" className={styles.icon} />
        {featuredDoneCheckmark}
        <h3>{I18n.home_pane.sidebar.feature}</h3>
        <p>
          {I18n.home_pane.sidebar.feature_blurb}
        </p>

        <button
          className={styles.sidebarBtnDisabled}
          disabled
          tabIndex="-1">
          {I18n.home_pane.sidebar.feature_button}
        </button>
      </div>
    </div>
  );
};

ManageData.propTypes = {
  db: PropTypes.object,
  columnsExist: PropTypes.bool
};

function HomePaneSidebar(props) {
  const { urlParams } = props;
  const showLog = urlParams.sidebarSelection === 'log';
  const contents = showLog ? (<ActivityFeed />) : <ManageData {...props} />;

  return (
    <div className={styles.sidebar}>
      <div className={styles.nav}>
        <Link to={Links.home}>
          <button className={!showLog ? styles.navBtnEnabled : styles.navBtn}>
            Manage
          </button>
        </Link>
        <Link to={Links.activityLog}>
          <button className={showLog ? styles.navBtnEnabled : styles.navBtn}>
            Recent Actions
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

const mapStateToProps = ({ db, routing }, { urlParams }) => ({
  db,
  urlParams,
  routing: routing.location,
  columnsExist: !_.isEmpty(db.output_columns)
});

export default connect(mapStateToProps)(HomePaneSidebar);