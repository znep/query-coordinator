import PropTypes from 'prop-types';
import React from 'react';
import styles from './SchemaPreviewTable.scss';

const SchemaPreviewTable = ({ outputColumns }) => {
  const rows = outputColumns.map(oc => {
    return (
      <tr className={oc.newCol ? styles.newCol : ''} key={oc.id}>
        <td>{oc.display_name}</td>
        <td>{oc.field_name}</td>
        <td>{oc.transform.output_soql_type}</td>
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
            <th className={styles.th}>Field Name</th>
            <th className={styles.th}>Type</th>
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
