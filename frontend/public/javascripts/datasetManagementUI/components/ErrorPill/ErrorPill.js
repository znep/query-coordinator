import PropTypes from 'prop-types';
import React from 'react';
import { commaify } from '../../../common/formatNumber';
import styles from './ErrorPill.module.scss';

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
