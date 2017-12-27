import PropTypes from 'prop-types';
import React from 'react';
import GeocodeShortcut from 'components/GeocodeShortcut/GeocodeShortcut';
import classNames from 'classnames';
import styles from './ShowOutputSchema.module.scss';

const GeocodeShortcutPane = ({ params }) => (
  <div className={classNames(styles.contentWrap, styles.optionsWrap)}>
    <GeocodeShortcut params={params} />
  </div>
);

GeocodeShortcutPane.propTypes = {
  params: PropTypes.object.isRequired
};

export default GeocodeShortcutPane;
