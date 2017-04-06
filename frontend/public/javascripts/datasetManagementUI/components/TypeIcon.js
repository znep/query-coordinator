import React, { PropTypes } from 'react';
import { soqlProperties as typeProperties } from '../lib/soqlTypes';
import SocrataIcon from '../../common/components/SocrataIcon';
import styles from 'styles/TypeIcon.scss';

const TypeIcon = ({ type }) =>
  <SocrataIcon name={typeProperties[type].icon} className={styles[typeProperties[type].cssName]} />;

TypeIcon.propTypes = {
  type: PropTypes.string.isRequired
};

export default TypeIcon;
