import React, { PropTypes } from 'react';
import styles from 'styles/Table/RowError.scss';

function escapeValue(value) {
  return value
    ? `"${value.replace('"', '\\"')}"`
    : '';
}

export default function RowError({ row }) {
  const { rowError, rowIdx } = row;
  const SubI18n = I18n.show_output_schema.row_errors;
  const malformedRowContents = rowError.contents.map(escapeValue).join(',');

  let malformedRowMessage;
  switch (rowError.type) {
    case 'too_short':
    case 'too_long':
      malformedRowMessage = {
        __html: SubI18n.error_message.format(
          `<span>${rowError.wanted}</span>`,
          `<span>${rowError.got}</span>`
        )
      };
      break;
    default:
      throw new TypeError(`Unknown error type: ${rowError.type}`);
  }

  return (
    <tr key={rowIdx} className={styles.malformedRow}>
      <td className={styles.location}>{SubI18n.row.format(rowError.offset + 1)}</td>
      <td className={styles.message} dangerouslySetInnerHTML={malformedRowMessage}></td>
      <td className={styles.contents}>{SubI18n.row_content}: <span>{malformedRowContents}</span></td>
    </tr>);
}

RowError.propTypes = {
  row: PropTypes.object.isRequired
};
