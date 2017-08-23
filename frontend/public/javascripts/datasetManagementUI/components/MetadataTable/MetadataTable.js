import React, { PropTypes } from 'react';
import { InfoPane } from 'common/components';
import CommonMetadataTable from '../../../common/components/MetadataTable';
import styles from './MetadataTable.scss';
import _ from 'lodash';

const MetadataTable = ({ view, customMetadataFieldsets, onClickEditMetadata }) => {
  if (_.isEmpty(view)) {
    return null;
  }

  return (
    <div className={styles.metadataContainer}>
      <div className={styles.infoPaneContainer}>
        <InfoPane name={view.name} description={view.description} category={view.category} />
      </div>
      <CommonMetadataTable
        view={view}
        customMetadataFieldsets={customMetadataFieldsets}
        onClickEditMetadata={onClickEditMetadata} />
    </div>
  );
};

MetadataTable.propTypes = {
  view: PropTypes.object.isRequired,
  customMetadataFieldsets: PropTypes.object.isRequired,
  onClickEditMetadata: PropTypes.func.isRequired
};

export default MetadataTable;
