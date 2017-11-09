import PropTypes from 'prop-types';
import React from 'react';
import SocrataIcon from '../../../common/components/SocrataIcon';
import styles from './SchemaPreviewTable.scss';

const SchemaPreviewTable = ({ outputColumns }) => {
  const rows = outputColumns.map(oc => {
    return (
      <tr className={oc.newCol ? styles.newCol : ''} key={oc.id}>
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
      <figcaption>Schema Preview</figcaption>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>Display Name</th>
            <th className={styles.th}>Type</th>
            <th className={styles.th}>Icon</th>
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
