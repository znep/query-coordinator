import PropTypes from 'prop-types';
import React from 'react';
import styles from './FormatColumn.scss';
import Alignment from './Alignment';

function TextColumnFormat({ onUpdateFormat, format }) {
  return (
    <div className={styles.formatColumn}>
      <form>
        <Alignment onChange={onUpdateFormat} format={format} />
      </form>
    </div>
  );
}

TextColumnFormat.propTypes = {
  onUpdateFormat: PropTypes.func.isRequired,
  format: PropTypes.object.isRequired
};

export default TextColumnFormat;
