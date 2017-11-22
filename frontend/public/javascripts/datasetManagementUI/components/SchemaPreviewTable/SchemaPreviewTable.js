import PropTypes from 'prop-types';
import React from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './SchemaPreviewTable.scss';

const SchemaPreviewTable = ({ outputColumns }) => {
  const rows = outputColumns.map((oc, idx) => {
    return (
      <tr className={oc.newCol ? styles.newCol : ''} key={idx}>
        <td className={styles.name}>{oc.display_name}</td>
        <td>{oc.transform.output_soql_type}</td>
        <td>
          <SocrataIcon name={oc.iconName} />
        </td>
      </tr>
    );
  });

  return (
    <figure className={styles.fig}>
      <figcaption>{I18n.add_col.schema_preview}</figcaption>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>{I18n.add_col.display_name}</th>
            <th className={styles.th}>{I18n.add_col.type}</th>
            <th className={styles.th}>{I18n.add_col.icon}</th>
          </tr>
        </thead>
        <tbody>{rows}</tbody>
      </table>
    </figure>
  );
};

SchemaPreviewTable.propTypes = {
  outputColumns: PropTypes.array.isRequired
};

export default SchemaPreviewTable;