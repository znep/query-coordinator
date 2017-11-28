import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { InfoPane } from 'common/components';
import CommonMetadataTable from 'common/components/MetadataTable';
import styles from './MetadataTable.scss';
import _ from 'lodash';
import { localizeLink } from 'common/locale';

export class MetadataTable extends Component {
  render() {
    const {
      associatedAssetsApiCalls,
      coreView,
      customMetadataFieldsets,
      onClickEditMetadata,
      disableContactDatasetOwner,
      editMetadataUrl,
      enableAssociatedAssets,
      onSaveAssociationCallback
    } = this.props;

    if (_.isEmpty(coreView)) {
      return null;
    }

    return (
      <div className={styles.metadataContainer}>
        <div className={styles.infoPaneContainer}>
          <InfoPane name={coreView.name} description={coreView.description} category={coreView.category} />
        </div>
        <CommonMetadataTable
          associatedAssetsApiCalls={associatedAssetsApiCalls}
          editMetadataUrl={editMetadataUrl}
          localizeLink={localizeLink}
          disableContactDatasetOwner={disableContactDatasetOwner}
          coreView={coreView}
          customMetadataFieldsets={customMetadataFieldsets}
          onClickEditMetadata={onClickEditMetadata}
          enableAssociatedAssets={enableAssociatedAssets}
          onSaveAssociatedAssets={(associatedAssets) => {
            const associatedAssetId = _.get(associatedAssets[0], 'id');
            if (associatedAssetId) {
              onSaveAssociationCallback(associatedAssetId);
            }
          }} />
      </div>
    );
  }
}

MetadataTable.propTypes = {
  associatedAssetsApiCalls: PropTypes.array,
  coreView: CommonMetadataTable.propTypes.coreView,
  customMetadataFieldsets: PropTypes.object.isRequired,
  disableContactDatasetOwner: PropTypes.bool,
  editMetadataUrl: PropTypes.string,
  onClickEditMetadata: PropTypes.func.isRequired,
  onSaveAssociationCallback: PropTypes.func,
  enableAssociatedAssets: PropTypes.bool
};

export default MetadataTable;
