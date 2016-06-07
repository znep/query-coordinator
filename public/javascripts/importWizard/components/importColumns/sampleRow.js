import _ from 'lodash';
import React, { PropTypes } from 'react';

export default (props) => {
  const { isHeader, row } = props;
  return (
    <tr className={ isHeader ? 'header' : '' } >
      {_.map(row, (val) => (
        <td>{ val }</td>
      ))}
    </tr>
  );
};
