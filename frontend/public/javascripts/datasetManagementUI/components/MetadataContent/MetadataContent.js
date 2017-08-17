/* eslint react/jsx-indent: 0 */
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import * as Links from 'links';
import MetadataEditor from 'containers/MetadataEditorContainer';
import styles from './MetadataContent.scss';

// TODO : should probably abstract sidebar to its own component
const MetadataContent = (
  { currentOutputSchemaId, onDatasetTab, params, onSidebarTabClick, columnsExist } // eslint-disable-line
) =>
  <div>
    <div className={styles.sidebar}>
      <Link
        to={Links.datasetMetadataForm(params)}
        className={styles.tab}
        onClick={() => onSidebarTabClick(params.fourfour)}
        activeClassName={styles.selected}>
        {I18n.metadata_manage.dataset_metadata_label}
      </Link>
      {columnsExist
        ? <Link
          to={Links.columnMetadataForm(params, currentOutputSchemaId)}
          className={styles.tab}
          onClick={() => onSidebarTabClick(params.fourfour)}
          activeClassName={styles.selected}>
            {I18n.metadata_manage.column_metadata_label}
          </Link>
        : <span className={styles.disabled} title={I18n.home_pane.sidebar.no_columns_msg}>
            {I18n.metadata_manage.column_metadata_label}
          </span>}
    </div>
    <MetadataEditor onDatasetTab={onDatasetTab} outputSchemaId={currentOutputSchemaId} />
  </div>;

MetadataContent.propTypes = {
  onSidebarTabClick: PropTypes.func,
  columnsExist: PropTypes.bool,
  currentOutputSchemaId: PropTypes.number,
  onDatasetTab: PropTypes.bool.isRequired,
  params: PropTypes.object.isRequired
};

export default MetadataContent;
