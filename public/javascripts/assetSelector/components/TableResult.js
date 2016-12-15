import React, { PropTypes } from 'react';
import { getDateLabel, getViewCountLabel } from '../../datasetLandingPage/lib/viewCardHelpers';

const TableResult = (props) => {
  return (
    <tr className="result">
      <td className="result-type" scope="row">
        {props.display_title}
      </td>
      <td className="result-name">
        <a href={props.link}>
          {props.name}
        </a>
      </td>
      <td className="result-updated-date">
        {getDateLabel(props.updated_at)}
      </td>
      <td className="result-popularity">
        {getViewCountLabel(props.view_count)}
      </td>
    </tr>
  );
};

TableResult.propTypes = {
  name: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  display_title: PropTypes.string.isRequired,
  updated_at: PropTypes.string,
  view_count: PropTypes.number.isRequired
};

TableResult.defaultProps = {
  link: '',
  name: '',
  display_title: '',
  view_count: 0
};

export default TableResult;
