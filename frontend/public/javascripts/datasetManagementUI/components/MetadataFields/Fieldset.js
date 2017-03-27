import React, { PropTypes } from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from 'styles/MetadataFields/FieldSet.scss';

const Fieldset = ({ children, title, subtitle, isPrivate }) =>
  <fieldset className={styles.fieldset}>
    <legend className={styles.tabTitle}>
      {title}
      {isPrivate && <SocrataIcon name="private" className={styles.icon} />}
    </legend>
    <span className={styles.tabSubtitle}>{subtitle}</span>
    {children}
  </fieldset>;

Fieldset.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.any,
  isPrivate: PropTypes.bool
};

export default Fieldset;
