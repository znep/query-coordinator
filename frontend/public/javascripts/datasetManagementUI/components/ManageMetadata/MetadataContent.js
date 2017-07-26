import { connect } from 'react-redux';
import React, { PropTypes } from 'react';
import { Link } from 'react-router';
import * as Links from '../../links';
import MetadataEditor from '../ManageMetadata/MetadataEditor';
import styles from 'styles/ManageMetadata/MetadataContent.scss';
import * as Selectors from '../../selectors';

// TODO : should probably abstract sidebar to its own component
export const MetadataContent = (
  { entities, onDatasetTab, fourfour, outputSchemaId, onSidebarTabClick, columnsExist } // eslint-disable-line
) =>
  <div>
    <div className={styles.sidebar}>
      <Link
        to={Links.datasetMetadataForm}
        className={styles.tab}
        onClick={() => onSidebarTabClick(fourfour)}
        activeClassName={styles.selected}>
        {I18n.metadata_manage.dataset_metadata_label}
      </Link>
      {columnsExist
        ? <Link
          to={Links.columnMetadataForm(outputSchemaId || Selectors.latestOutputSchema(entities).id)}
          className={styles.tab}
          onClick={() => onSidebarTabClick(fourfour)}
          activeClassName={styles.selected}>
            {I18n.metadata_manage.column_metadata_label}
        </Link>
        : <span className={styles.disabled} title={I18n.home_pane.sidebar.no_columns_msg}>
            {I18n.metadata_manage.column_metadata_label}
        </span>}
    </div>
    <MetadataEditor onDatasetTab={onDatasetTab} outputSchemaId={outputSchemaId} />
  </div>;

MetadataContent.propTypes = {
  onSidebarTabClick: PropTypes.func,
  fourfour: PropTypes.string.isRequired,
  columnsExist: PropTypes.bool,
  entities: PropTypes.object.isRequired,
  outputSchemaId: PropTypes.number,
  onDatasetTab: PropTypes.bool.isRequired
};

const mapStateToProps = ({ entities }, props) => ({
  ...props,
  entities
});

export default connect(mapStateToProps)(MetadataContent);
