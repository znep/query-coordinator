import PropTypes from 'prop-types';
import React from 'react';
import GeocodeShortcut from 'containers/GeocodeShortcutContainer';
import classNames from 'classnames';
import styles from './ShowOutputSchema.module.scss';

const GeocodeShortcutPane = ({ params, location, newOutputSchema }) => (
  <div className={classNames(styles.contentWrap, styles.optionsWrap)}>
    <GeocodeShortcut params={params} location={location} newOutputSchema={newOutputSchema} />
  </div>
);

GeocodeShortcutPane.propTypes = {
  params: PropTypes.object.isRequired,
  location: PropTypes.object.isRequired,
  newOutputSchema: PropTypes.func
};

export default GeocodeShortcutPane;
