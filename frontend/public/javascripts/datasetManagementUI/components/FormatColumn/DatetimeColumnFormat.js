import PropTypes from 'prop-types';
import React from 'react';
import styles from './FormatColumn.module.scss';
import Alignment from './Alignment';
import DatetimeFormat from './DatetimeFormat';

function DatetimeColumnFormat({ onUpdateFormat, format }) {
  return (
    <div className={styles.formatColumn}>
      <form>
        <Alignment onChange={onUpdateFormat} format={format} />
        <DatetimeFormat onChange={onUpdateFormat} format={format} />
      </form>
    </div>
  );
}

DatetimeColumnFormat.propTypes = {
  onUpdateFormat: PropTypes.func.isRequired,
  onRemoveFormat: PropTypes.func.isRequired,
  format: PropTypes.object.isRequired
};

export default DatetimeColumnFormat;
