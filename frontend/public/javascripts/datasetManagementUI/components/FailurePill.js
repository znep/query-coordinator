import React from 'react';
import styles from 'styles/ErrorPill.scss';
import SocrataIcon from '../../common/components/SocrataIcon';

function FailurePill() {
  return (
    <span className={styles.errorPill}>
      <SocrataIcon name="warning-alt2" />
    </span>
  );
}

FailurePill.propTypes = {};

export default FailurePill;
