import * as React from 'react';
import PropTypes from 'prop-types';
import TypeIcon from '../TypeIcon/TypeIcon';
import * as styles from './SoQLEditor.scss';

const ColumnDoc = ({ completion }) => {
  if (completion.column) {
    const column = completion.column;
    return (
      <div className={styles.doc}>
        <h4><TypeIcon type={column.soql_type} isDisabled={false} /> Column: {column.field_name}</h4>
        <h6>Type: {column.soql_type}</h6>
      </div>
    );
  }

  return null;
};

ColumnDoc.propTypes = {
  completion: PropTypes.object.isRequired
};

export default ColumnDoc;
