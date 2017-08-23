import React, { PropTypes } from 'react';
import { soqlProperties as typeProperties } from 'lib/soqlTypes';
import SocrataIcon from '../../../common/components/SocrataIcon';
import classNames from 'classnames';
import styles from './TypeIcon.scss';

const TypeIcon = ({ type, isDisabled }) => {
  const klass = classNames(
    styles[typeProperties[type].cssName],
    { [styles.typeIconDisabled]: isDisabled }
  );
  return <SocrataIcon name={typeProperties[type].icon} className={klass} />;
};


TypeIcon.propTypes = {
  type: PropTypes.string.isRequired,
  isDisabled: PropTypes.bool
};

export default TypeIcon;
