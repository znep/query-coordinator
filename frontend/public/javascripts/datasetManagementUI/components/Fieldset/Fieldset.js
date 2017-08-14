import React, { PropTypes } from 'react';
import styles from './FieldSet.scss';

const Fieldset = ({ children, title, subtitle }) =>
  <fieldset className={styles.fieldset}>
    <legend className={styles.tabTitle}>
      {title}
    </legend>
    <span className={styles.tabSubtitle}>
      {subtitle}
    </span>
    {children}
  </fieldset>;

Fieldset.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.any
};

export default Fieldset;
