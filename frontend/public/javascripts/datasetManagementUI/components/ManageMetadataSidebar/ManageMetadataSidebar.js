import PropTypes from 'prop-types';
import React from 'react';
import { Link } from 'react-router';
import * as Links from 'links/links';
import StatusIndicator from 'components/StatusIndicator/StatusIndicator';
import styles from './ManageMetadataSidebar.scss';

const datasetMetadataEnabled = !window.serverConfig.featureFlags.usaid_features_enabled;

const ManageMetadataSidebar = ({
  params,
  outputSchemaId,
  columnsExist,
  hideFlash,
  datasetFormStatus,
  columnFormStatus
}) => {
  return (
    <div className={styles.sidebar}>
      {datasetMetadataEnabled ? (
        <Link
          onClick={!!params.outputSchemaId ? hideFlash : () => {}}
          to={Links.datasetMetadataForm(params)}
          className={styles.tab}
          activeClassName={styles.selected}>
          {I18n.metadata_manage.dataset_metadata_label}
          <StatusIndicator formStatus={datasetFormStatus} />
        </Link>
      ) : (
        <span className={styles.disabled}>{I18n.metadata_manage.dataset_metadata_label}</span>
      )}
      {columnsExist ? (
        <Link
          onClick={!!params.outputSchemaId ? () => {} : hideFlash}
          to={Links.columnMetadataForm(params, outputSchemaId)}
          className={styles.tab}
          activeClassName={styles.selected}>
          {I18n.metadata_manage.column_metadata_label}
          <StatusIndicator formStatus={columnFormStatus} />
        </Link>
      ) : (
        <span className={styles.disabled} title={I18n.home_pane.sidebar.no_columns_msg}>
          {I18n.metadata_manage.column_metadata_label}
        </span>
      )}
    </div>
  );
};

ManageMetadataSidebar.propTypes = {
  params: PropTypes.object.isRequired,
  hideFlash: PropTypes.func.isRequired,
  outputSchemaId: PropTypes.number.isRequired,
  columnsExist: PropTypes.bool.isRequired,
  datasetFormStatus: PropTypes.string.isRequired,
  columnFormStatus: PropTypes.string.isRequired
};

export default ManageMetadataSidebar;
