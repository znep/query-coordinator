import React, { PropTypes } from 'react';
import styles from './GeocodeShortcut.scss';

const SubI18n = I18n.show_output_schema.geocode_shortcut;

const HideOriginal = ({ toggleHideOriginal, shouldHideOriginal }) => {
  const checked = shouldHideOriginal ? 'checked' : '';
  return (
    <div className={styles.hideOriginal}>
      <input id="hide-original" type="checkbox" checked={checked} />
      <label htmlFor="hide-original" onClick={toggleHideOriginal}>
        <span className="fake-checkbox">
          <span className="socrata-icon-checkmark3" />
        </span>
        {SubI18n.hide_original_columns}
      </label>
    </div>
  );
};

HideOriginal.propTypes = {
  toggleHideOriginal: PropTypes.func.isRequired,
  shouldHideOriginal: PropTypes.bool.isRequired
};

export default HideOriginal;
