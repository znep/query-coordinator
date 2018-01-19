import React from 'react';
import styles from 'datasetManagementUI/components/ErrorPill/ErrorPill.module.scss';
import SocrataIcon from '../../../common/components/SocrataIcon';

function FailurePill() {
  return (
    <span className={styles.errorPill}>
      <SocrataIcon name="warning-alt2" />
    </span>
  );
}

export default FailurePill;
