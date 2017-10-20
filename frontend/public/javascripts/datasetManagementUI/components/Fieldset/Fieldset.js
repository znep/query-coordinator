import PropTypes from 'prop-types';
import React from 'react';
import styles from './FieldSet.scss';

const Fieldset = ({ children, title, subtitle, containerClass, legendClass }) => {
  let fsClasses = [styles.fieldset]; // eslint-disable-line prefer-const
  let legendClasses = [styles.tabTitle]; // eslint-disable-line prefer-const

  if (containerClass) {
    fsClasses.push(containerClass);
  }

  if (legendClass) {
    legendClasses.push(legendClass);
  }

  return (
    <fieldset className={fsClasses.join(' ')}>
      <legend className={legendClasses.join(' ')}>{title}</legend>
      <span className={styles.tabSubtitle}>{subtitle}</span>
      {children}
    </fieldset>
  );
};

Fieldset.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.any,
  containerClass: PropTypes.string,
  legendClass: PropTypes.string
};

export default Fieldset;
