import React, { PropTypes } from 'react';

export const TableResult = (props) => {
  const data = props.data;
  const updatedAt = new Date(data.resource.updatedAt).toDateString();

  return (
    <tr className="result">
      <td className="result-type" scope="row">
        {data.resource.type}
      </td>
      <td className="result-name">
        <a href={data.link}>
          {data.resource.name}
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
