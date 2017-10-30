import PropTypes from 'prop-types';
import React from 'react';
import styles from './FormatColumn.scss';
import Alignment from './Alignment';
import PrecisionStyle from './PrecisionStyle';
import DecimalPrecision from './DecimalPrecision';
import NumberSeparators from './NumberSeparators';

function NumberColumnFormat({ onUpdateFormat, onRemoveFormat, format }) {
  return (
    <div className={styles.formatColumn}>
      <form>
        <Alignment
          onChange={onUpdateFormat}
          format={format} />

        <PrecisionStyle
          onChange={onUpdateFormat}
          format={format} />

        <DecimalPrecision
          onChange={onUpdateFormat}
          onRemove={onRemoveFormat}
          format={format} />

        <NumberSeparators
          onChange={onUpdateFormat}
          onRemove={onRemoveFormat}
          format={format} />
      </form>
    </div>
  );
}

NumberColumnFormat.propTypes = {
  onUpdateFormat: PropTypes.func.isRequired,
  onRemoveFormat: PropTypes.func.isRequired,
  format: PropTypes.object.isRequired
};

export default NumberColumnFormat;
