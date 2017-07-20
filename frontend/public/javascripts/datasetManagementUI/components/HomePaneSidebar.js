import _ from 'lodash';
import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import * as Links from '../links';
import * as Selectors from '../selectors';
import RecentActions from './RecentActions';
import SocrataIcon from '../../common/components/SocrataIcon';
import styles from 'styles/HomePaneSidebar.scss';

function query(entities) {
  const currentOutputSchema = Selectors.latestOutputSchema(entities);
  const outputColumns = currentOutputSchema
    ? Selectors.columnsForOutputSchema(entities, currentOutputSchema.id)
    : [];
  return {
    hasMetadata: !!_.values(entities.views)[0].description, // TODO: do we want to have this be more strict?
    hasData: entities.sources.length > 0,
    anyColumnHasDescription: outputColumns.some(outputColumn => outputColumn.description)
  };
}

export const ManageData = props => {
  const { entities, columnsExist } = props;
  const { anyColumnHasDescription } = query(entities);

  const doneCheckmark = <SocrataIcon name="checkmark-alt" className={styles.icon} />;
  const columnDescriptionCheckmark = anyColumnHasDescription ? doneCheckmark : null;

  // TODO: Handle features and visualizations.
  const visualizationDoneCheckmark = null;
  const featuredDoneCheckmark = null;

  const columnDescriptionLink = columnsExist ?
    Links.columnMetadataForm(Selectors.latestOutputSchema(entities).id) :
    '';

  return (
    <div className={styles.sidebarData}>
      <div>
        <SocrataIcon name="column-info" className={styles.icon} />
        {columnDescriptionCheckmark}

        <h3>{I18n.home_pane.sidebar.column_descriptions}</h3>
        <p> {I18n.home_pane.sidebar.column_descriptions_blurb}{' '}
        </p>
        // TODO: latestOutputSchema here is wrong
        <Link to={columnDescriptionLink}>
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
        <button className={styles.sidebarBtnDisabled} disabled tabIndex="-1">
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

        <button className={styles.sidebarBtnDisabled} disabled tabIndex="-1">
          {I18n.home_pane.sidebar.feature_button}
        </button>
      </div>
    </div>
  );
};

ManageData.propTypes = {
  entities: PropTypes.object,
  columnsExist: PropTypes.bool
};

function HomePaneSidebar(props) {
  const { urlParams } = props;
  const showManageTab = urlParams.sidebarSelection === 'manageTab';
  const contents = showManageTab ? <ManageData {...props} /> : <RecentActions />;

  return (
    <div className={styles.sidebar}>
      <div className={styles.nav}>
        <Link to={Links.home}>
          <button className={!showManageTab ? styles.navBtnEnabled : styles.navBtn}>
            {I18n.home_pane.home_pane_sidebar.recent_actions}
          </button>
        </Link>
        <Link to={Links.manageTab}>
          <button className={showManageTab ? styles.navBtnEnabled : styles.navBtn}>
            {I18n.home_pane.home_pane_sidebar.manage}
          </button>
        </Link>
      </div>
      {contents}
    </div>
  );
}

HomePaneSidebar.propTypes = {
  location: PropTypes.object.isRequired,
  entities: PropTypes.object.isRequired,
  urlParams: PropTypes.object.isRequired
};

const mapStateToProps = ({ entities, ui }, { urlParams }) => ({
  entities,
  urlParams,
  location: ui.routing.location,
  columnsExist: !_.isEmpty(entities.output_columns)
});

export default connect(mapStateToProps)(HomePaneSidebar);
