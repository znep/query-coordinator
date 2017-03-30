import React, { PropTypes } from 'react';
import styles from 'styles/Table/RowError.scss';

export default function RowError({ rowError }) {
  const SubI18n = I18n.show_output_schema.row_errors;
  return (
    <td className={styles.container} style={{ width: '100%' }}>
      <span className={styles.malformedRowTag}>!</span>
      <span className={styles.malformedRowLocation}>{SubI18n.row} {rowError.offset}:</span>
      <span className={styles.malformedRowError}>
        {SubI18n.expected} <span className={styles.rowErrorNumber}>{rowError.wanted}</span>&nbsp;
        {SubI18n.columns_found}&nbsp;
        <span className={styles.rowErrorNumber}>{rowError.got}</span>
      </span>
      <span className={styles.malformedRowContents}>
        <span className={styles.rowContentLabel}>{SubI18n.row_content}:</span>&nbsp;
        {rowError.contents.map((cell) => `"${cell.replace('"', '\\"')}"`).join(',')}
      </span>
    </td>
  );
}

RowError.propTypes = {
  rowError: PropTypes.object.isRequired
};
