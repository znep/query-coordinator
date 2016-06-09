import React, { PropTypes } from 'react';

export default ({ isHeader, row }) => {
  return (
    <tr className={ isHeader ? 'header' : '' } >
      {row.map((val) => (
        <td>{ val }</td>
      ))}
    </tr>
  );
};
