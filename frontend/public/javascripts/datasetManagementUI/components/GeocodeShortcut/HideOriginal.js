import PropTypes from 'prop-types';
import React from 'react';
import styles from './GeocodeShortcut.module.scss';

const SubI18n = I18n.show_output_schema.geocode_shortcut;

const HideOriginal = ({ toggleHideOriginal, shouldHideOriginal }) => {
  const checked = shouldHideOriginal ? 'checked' : '';
  return (
    <div className={styles.hideOriginal}>
      <input id="hide-original" type="checkbox" defaultChecked={checked} />
      <label htmlFor="hide-original" onClick={toggleHideOriginal}>
        <span className={styles.fakeCheckbox}>
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
