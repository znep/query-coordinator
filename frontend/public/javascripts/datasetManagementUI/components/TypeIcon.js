import React, { PropTypes } from 'react';
import classNames from 'classnames';
import { soqlProperties as typeProperties } from '../lib/soqlTypes';

export default function TypeIcon({ type }) {
  return (
    <span
      className={classNames(
          'type-icon',
          `socrata-icon-${typeProperties[type].icon}`,
          `type-icon-${typeProperties[type].canonicalName}`
        )} />
  );
}

TypeIcon.propTypes = {
  type: PropTypes.string.isRequired
};
