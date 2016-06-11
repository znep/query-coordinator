import React, { PropTypes } from 'react';

const view = ({ isHeader, row }) => {
  return (
    <tr className={isHeader ? 'header' : ''} >
      {row.map((val, idx) => (
        <td key={idx}>{val}</td>
      ))}
    </tr>
  );
};

view.propTypes = {
  isHeader: PropTypes.bool.isRequired,
  row: PropTypes.array.isRequired
};

export default view;
