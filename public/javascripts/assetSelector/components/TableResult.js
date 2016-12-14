import React, { PropTypes } from 'react';

export const TableResult = (props) => {
  const data = props.data;
  const updatedAt = new Date(data.updated_at).toDateString();

  return (
    <tr className="result">
      <td className="result-type" scope="row">
        {data.type}
      </td>
      <td className="result-name">
        <a href={data.link}>
          {data.name}
        </a>
      </td>
      <td className="result-updated-date">
        {updatedAt}
      </td>
      <td className="result-popularity">???</td>
    </tr>
  );
};

TableResult.propTypes = {
  data: PropTypes.object.isRequired
};

export default TableResult;
