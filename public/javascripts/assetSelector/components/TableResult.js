import React, { PropTypes } from 'react';
import { getDateLabel } from '../../datasetLandingPage/lib/viewCardHelpers';

export const TableResult = (props) => {
  const data = props.data;

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
        {getDateLabel(data.updated_at)}
      </td>
      <td className="result-popularity">???</td>
    </tr>
  );
};

TableResult.propTypes = {
  data: PropTypes.object.isRequired
};

export default TableResult;
