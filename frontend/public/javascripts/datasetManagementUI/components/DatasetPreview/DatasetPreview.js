import React, { PropTypes } from 'react';
import { components as SocrataVisualizations } from 'common/visualizations';
import styles from './DatasetPreview.scss';

const DatasetPreview = ({ vif }) =>
  <div className={styles.tableContents}>
    <SocrataVisualizations.Visualization vif={vif} />
  </div>;

DatasetPreview.propTypes = {
  vif: PropTypes.object.isRequired
};

export default DatasetPreview;
