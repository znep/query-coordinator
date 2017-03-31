import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import * as Links from '../../links';
import DatasetMetadataEditor from '../ManageMetadata/DatasetMetadataEditor';
import ColumnMetadataEditor from '../ManageMetadata/ColumnMetadataEditor';
import styles from 'styles/ManageMetadata/MetadataContent.scss';

export default function MetadataContent(props) {
  const { path } = props;

  // TODO: abstact below into its own component
  switch (path) {
    case 'metadata/dataset':
      return (
        <div>
          <ul className={styles.sidebar}>
            <li className={styles.selected}>
              <Link to={Links.datasetMetadataEditor}>{I18n.metadata_manage.dataset_metadata_label}</Link>
            </li>
            <li>
              <Link to={Links.columnMetadataEditor()}>{I18n.metadata_manage.column_metadata_label}</Link>
            </li>
          </ul>
          <DatasetMetadataEditor view={props.view} />
        </div>
      );
    case 'metadata/columns':
      return (
        <div>
          <ul className={styles.sidebar}>
            <li>
              <Link to={Links.datasetMetadataEditor}>{I18n.metadata_manage.dataset_metadata_label}</Link>
            </li>
            <li className={styles.selected}>
              <Link to={Links.columnMetadataEditor()}>{I18n.metadata_manage.column_metadata_label}</Link>
            </li>
          </ul>

          <ColumnMetadataEditor onEdit={props.onEditColumnMetadata} />
        </div>
      );
    default:
      throw new ReferenceError(`No tab found for ${path}!`);
  }
}

MetadataContent.propTypes = {
  path: PropTypes.string.isRequired,
  onEditColumnMetadata: PropTypes.func.isRequired,
  view: PropTypes.object.isRequired
};
