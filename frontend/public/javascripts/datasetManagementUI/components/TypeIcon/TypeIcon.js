import PropTypes from 'prop-types';
import React from 'react';
import { soqlProperties as typeProperties } from 'datasetManagementUI/lib/soqlTypes';
import SocrataIcon from '../../../common/components/SocrataIcon';
import classNames from 'classnames';
import styles from './TypeIcon.module.scss';

const TypeIcon = ({ type, isDisabled }) => {
  const t = typeProperties[type];
  if (!t) return null;
  const klass = classNames(
    styles[t.cssName],
    { [styles.typeIconDisabled]: isDisabled }
  );
  return <SocrataIcon name={typeProperties[type].icon} className={klass} />;
};


TypeIcon.propTypes = {
  type: PropTypes.string.isRequired,
  isDisabled: PropTypes.bool
};

export default TypeIcon;
