import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import * as Links from '../../links';
import MetadataEditor from '../ManageMetadata/MetadataEditor';
import styles from 'styles/ManageMetadata/MetadataContent.scss';

// TODO : should probably abstract sidebar to its own component
const MetadataContent = ({ path, onSidebarTabClick }) =>
  <div>
    <div className={styles.sidebar}>
      <Link
        to={Links.datasetMetadataForm}
        className={styles.tab}
        onClick={onSidebarTabClick}
        activeClassName={styles.selected}>
        {I18n.metadata_manage.dataset_metadata_label}
      </Link>
      <Link
        to={Links.columnMetadataForm()}
        className={styles.tab}
        onClick={onSidebarTabClick}
        activeClassName={styles.selected}>
        {I18n.metadata_manage.column_metadata_label}
      </Link>
    </div>
    <MetadataEditor path={path} />
  </div>;

MetadataContent.propTypes = {
  path: PropTypes.string.isRequired,
  onSidebarTabClick: PropTypes.func
};

export default MetadataContent;
