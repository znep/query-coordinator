import React, { PropTypes } from 'react';
import styles from 'styles/Modals/GeocodeShortcut.scss';
const SubI18n = I18n.show_output_schema.geocode_shortcut;

const ErrorHandling = ({ toggleConvertToNull, shouldConvertToNull }) => (
  <div className={styles.errorHandling}>
    <h6>{SubI18n.error_handling}</h6>
    <div>
      <input
        type="radio"
        id="as-null"
        name="radio"
        onChange={toggleConvertToNull}
        checked={shouldConvertToNull} />
      <label htmlFor="as-null">
        <span className="fake-radiobutton"></span>
        {SubI18n.treat_as_empty}
        <p className={styles.labelSubtitle}>{SubI18n.what_is_forgive}</p>
      </label>
    </div>
    <div>
      <input
        type="radio"
        id="as-error"
        name="radio"
        onChange={toggleConvertToNull}
        checked={!shouldConvertToNull} />
      <label htmlFor="as-error"><span className="fake-radiobutton"></span>
        {SubI18n.skip_row}
      </label>
      <p className={styles.labelSubtitle}>{SubI18n.what_is_an_error}</p>
    </div>
  </div>
);

ErrorHandling.propTypes = {
  toggleConvertToNull: PropTypes.func.isRequired,
  shouldConvertToNull: PropTypes.bool.isRequired
};

export default ErrorHandling;
