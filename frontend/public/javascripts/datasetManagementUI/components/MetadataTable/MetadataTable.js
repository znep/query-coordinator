import PropTypes from 'prop-types';
import React from 'react';
import { InfoPane } from 'common/components';
import CommonMetadataTable from 'common/components/MetadataTable';
import styles from './MetadataTable.scss';
import _ from 'lodash';
import { localizeLink } from 'common/locale';

const MetadataTable = ({
  coreView,
  customMetadataFieldsets,
  onClickEditMetadata,
  disableContactDatasetOwner,
  editMetadataUrl
}) => {
  if (_.isEmpty(coreView)) {
    return null;
  }

  return (
    <div className={styles.metadataContainer}>
      <div className={styles.infoPaneContainer}>
        <InfoPane name={coreView.name} description={coreView.description} category={coreView.category} />
      </div>
      <CommonMetadataTable
        editMetadataUrl={editMetadataUrl}
        localizeLink={localizeLink}
        disableContactDatasetOwner={disableContactDatasetOwner}
        coreView={coreView}
        customMetadataFieldsets={customMetadataFieldsets}
        onClickEditMetadata={onClickEditMetadata} />
    </div>
  );
};

MetadataTable.propTypes = {
  coreView: CommonMetadataTable.propTypes.coreView,
  customMetadataFieldsets: PropTypes.object.isRequired,
  disableContactDatasetOwner: PropTypes.bool,
  editMetadataUrl: PropTypes.string,
  onClickEditMetadata: PropTypes.func.isRequired
};

export default MetadataTable;
