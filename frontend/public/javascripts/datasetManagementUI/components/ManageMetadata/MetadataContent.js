import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import * as Links from '../../links';
import MetadataEditor from '../ManageMetadata/MetadataEditor';
import styles from 'styles/ManageMetadata/MetadataContent.scss';

// TODO : should probably abstract sidebar to its own component
const MetadataContent = ({ path, fourfour, onSidebarTabClick, columnsExist }) =>
  <div>
    <div className={styles.sidebar}>
      <Link
        to={Links.datasetMetadataForm}
        className={styles.tab}
        onClick={() => onSidebarTabClick(fourfour)}
        activeClassName={styles.selected}>
        {I18n.metadata_manage.dataset_metadata_label}
      </Link>
      {columnsExist ?
        <Link
          to={Links.columnMetadataForm()}
          className={styles.tab}
          onClick={() => onSidebarTabClick(fourfour)}
          activeClassName={styles.selected}>
            {I18n.metadata_manage.column_metadata_label}
        </Link> :
        <span className={styles.disabled}>
          {I18n.metadata_manage.column_metadata_label}
        </span>}
    </div>
    <MetadataEditor path={path} />
  </div>;

MetadataContent.propTypes = {
  path: PropTypes.string.isRequired,
  onSidebarTabClick: PropTypes.func,
  fourfour: PropTypes.string.isRequired,
  columnsExist: PropTypes.bool
};

export default MetadataContent;
