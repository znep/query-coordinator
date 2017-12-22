import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import styles from './FormatColumn.scss';
import classNames from 'classnames';
import TextInput from 'components/TextInput/TextInput';

const SubI18n = I18n.format_column;

function NumberSeparators({ onChange, format, onRemove }) {
  const noCommasChecked = format.noCommas ? 'checked' : '';
  const toggleNoCommas = () => onChange({ noCommas: !format.noCommas });

  const thousandsDisabled = !!format.noCommas;
  const isOverridingThousands = !_.isUndefined(format.groupSeparator);
  const thousandsSeparatorChecked = isOverridingThousands ? 'checked' : '';
  const toggleThousandsSeparator = () => {
    if (!thousandsDisabled) {
      if (isOverridingThousands) {
        onRemove('groupSeparator');
      } else {
        onChange({ groupSeparator: ',' });
      }
    }
  };
  const overrideThousands = isOverridingThousands ? (
    <TextInput
      field={{
        name: 'override-thousands',
        value: format.groupSeparator
      }}
      inErrorState={false}
      handleChange={e => onChange({ groupSeparator: e.target.value || '' })} />
  ) : null;

  const isOverridingDecimal = !_.isUndefined(format.decimalSeparator);
  const decimalSeparatorChecked = isOverridingDecimal ? 'checked' : '';
  const toggleDecimalSeparator = () => {
    if (isOverridingDecimal) {
      onRemove('decimalSeparator');
    } else {
      onChange({ decimalSeparator: '.' });
    }
  };
  const overrideDecimals = isOverridingDecimal ? (
    <TextInput
      field={{
        name: 'override-decimal',
        value: format.decimalSeparator
      }}
      inErrorState={false}
      handleChange={e => onChange({ decimalSeparator: e.target.value || '' })} />
  ) : null;

  return (
    <div>
      <div className={styles.noCommas}>
        <input id="no-commas" type="checkbox" checked={noCommasChecked} />
        <label htmlFor="no-commas" onClick={toggleNoCommas}>
          <span className="fake-checkbox">
            <span className="socrata-icon-checkmark3" />
          </span>
          {SubI18n.hide_thousands}
        </label>
      </div>

      <div className={classNames(styles.thousandsSeparator, { [styles.disabled]: thousandsDisabled })}>
        <input id="thousands-separator" type="checkbox" checked={thousandsSeparatorChecked} />
        <label htmlFor="thousands-separator" onClick={toggleThousandsSeparator} disabled>
          <span className="fake-checkbox">
            <span className="socrata-icon-checkmark3" />
          </span>
          {SubI18n.override_thousands}
        </label>
        {overrideThousands}
      </div>

      <div className={styles.decimalSeparator}>
        <input id="decimal-separator" type="checkbox" checked={decimalSeparatorChecked} />
        <label htmlFor="decimal-separator" onClick={toggleDecimalSeparator}>
          <span className="fake-checkbox">
            <span className="socrata-icon-checkmark3" />
          </span>
          {SubI18n.override_decimal}
        </label>
        {overrideDecimals}
      </div>
    </div>
  );
}

NumberSeparators.propTypes = {
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  format: PropTypes.object.isRequired
};

export default NumberSeparators;
