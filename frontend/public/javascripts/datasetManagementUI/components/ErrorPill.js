import React, { PropTypes } from 'react';
import { commaify } from '../../common/formatNumber';
import styles from 'styles/ErrorPill.scss';

function ErrorPill({ number }) {
  return (
    <span className={styles.errorPill}>
      {commaify(number)}
    </span>
  );
}

ErrorPill.propTypes = {
  number: PropTypes.number.isRequired
};

export default ErrorPill;
