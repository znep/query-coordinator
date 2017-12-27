import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './FormatColumn.module.scss';

const SubI18n = I18n.format_column;

function DecimalPrecision({ onChange, format, onRemove }) {
  const isSpecifyingPrecision = !_.isUndefined(format.precision);
  const specifyPrecisionChecked = isSpecifyingPrecision ? 'checked' : '';
  const toggleSpecifyPrecision = () => {
    if (isSpecifyingPrecision) {
      onRemove('precision');
    } else {
      onChange({ precision: 2 });
    }
  };

  const slider = isSpecifyingPrecision ? (<input
    type="range"
    min="0"
    max="10"
    step="1"
    defaultValue={format.precision}
    onChange={e => onChange({ precision: _.toNumber(e.target.value) })} />) : null;

  const value = isSpecifyingPrecision ? (<span className={styles.precisionValue}>
    {format.precision}
  </span>) : null;

  return (
    <div>
      <div className={styles.noCommas}>
        <input id="decimal-precision" type="checkbox" defaultChecked={specifyPrecisionChecked} />
        <label htmlFor="decimal-precision" onClick={toggleSpecifyPrecision}>
          <span className="fake-checkbox">
            <span className="socrata-icon-checkmark3" />
          </span>
          {SubI18n.specify_precision}
        </label>
      </div>

      {slider}
      {value}
    </div>
  );
}

DecimalPrecision.propTypes = {
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  format: PropTypes.object.isRequired
};

export default DecimalPrecision;
