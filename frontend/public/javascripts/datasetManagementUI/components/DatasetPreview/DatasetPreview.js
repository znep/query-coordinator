import PropTypes from 'prop-types';
import React from 'react';
import { components as SocrataVisualizations } from 'common/visualizations';
import styles from './DatasetPreview.module.scss';

const DatasetPreview = ({ vif }) =>
  <div className={styles.tableContents}>
    <SocrataVisualizations.Visualization vif={vif} />
  </div>;

DatasetPreview.propTypes = {
  vif: PropTypes.object.isRequired
};

export default DatasetPreview;
