import React, { PropTypes } from 'react';
import _ from 'lodash';
import * as Selectors from 'selectors';
import SocrataIcon from '../../common/components/SocrataIcon';
import { Link } from 'react-router';
import * as Links from 'links';
import styles from 'styles/HomePaneSidebar.scss';

function query(entities) {
  const currentOutputSchema = Selectors.currentOutputSchema(entities);

  const outputColumns = currentOutputSchema
    ? Selectors.columnsForOutputSchema(entities, currentOutputSchema.id)
    : [];

  return {
    hasMetadata: !!_.values(entities.views)[0].description, // TODO: do we want to have this be more strict?
    hasData: entities.sources.length > 0,
    anyColumnHasDescription: outputColumns.some(outputColumn => outputColumn.description)
  };
}

const ManageData = ({ entities, columnsExist, params }) => {
  const { anyColumnHasDescription } = query(entities);

  const doneCheckmark = <SocrataIcon name="checkmark-alt" className={styles.icon} />;
  const columnDescriptionCheckmark = anyColumnHasDescription ? doneCheckmark : null;

  // TODO: Handle features and visualizations.
  const visualizationDoneCheckmark = null;
  const featuredDoneCheckmark = null;

  const currentOutputSchema = Selectors.currentOutputSchema(entities);
  const columnDescriptionLink = currentOutputSchema
    ? Links.columnMetadataForm(params, currentOutputSchema.id)
    : '';

  return (
    <div className={styles.sidebarData}>
      <div>
        <SocrataIcon name="column-info" className={styles.icon} />
        {columnDescriptionCheckmark}

        <h3>
          {I18n.home_pane.sidebar.column_descriptions}
        </h3>
        <p>
          {' '}{I18n.home_pane.sidebar.column_descriptions_blurb}{' '}
        </p>
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
        <h3>
          {I18n.home_pane.sidebar.visualize}
        </h3>
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
        <h3>
          {I18n.home_pane.sidebar.feature}
        </h3>
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
  columnsExist: PropTypes.bool,
  params: PropTypes.object.isRequired
};

export default ManageData;
