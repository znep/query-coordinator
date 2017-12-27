import PropTypes from 'prop-types';
import React from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './FieldSet.module.scss';

const Fieldset = ({ children, title, subtitle, closable, closeCallback, containerClass, legendClass }) => {
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
      <legend className={legendClasses.join(' ')}>
        {title}
        {closable && (
          <SocrataIcon name="close-2" className={styles.closeButton} onIconClick={closeCallback} />
        )}
      </legend>
      <span className={styles.tabSubtitle}>{subtitle}</span>
      {children}
    </fieldset>
  );
};

Fieldset.propTypes = {
  title: PropTypes.string,
  subtitle: PropTypes.string,
  children: PropTypes.any,
  containerClass: PropTypes.string,
  legendClass: PropTypes.string,
  closable: PropTypes.bool,
  closeCallback: PropTypes.func
};

export default Fieldset;
