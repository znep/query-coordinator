import React, { PropTypes } from 'react';
import styles from 'styles/Table/RowError.scss';

export default function RowError({ rowError, rowIdx }) {
  const SubI18n = I18n.show_output_schema.row_errors;

  const malformedRowContents = rowError.error.contents.map(cell => `"${cell.replace('"', '\\"')}"`).join(',');
  const malformedRowMessage = {
    __html: SubI18n.error_message.format(
      `<span>${rowError.error.wanted}</span>`,
      `<span>${rowError.error.got}</span>`
    )
  };

  return (
    <tr key={rowIdx} className={styles.malformedRow}>
      <td className={styles.location}>{SubI18n.row.format(rowError.offset + 1)}</td>
      <td className={styles.message} dangerouslySetInnerHTML={malformedRowMessage}></td>
      <td className={styles.contents}>{SubI18n.row_content}: <span>{malformedRowContents}</span></td>
    </tr>);
}

RowError.propTypes = {
  rowError: PropTypes.object.isRequired,
  rowIdx: PropTypes.number.isRequired
};
