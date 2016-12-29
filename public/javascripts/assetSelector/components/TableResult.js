import React, { PropTypes } from 'react';
import { getDateLabel, getViewCountLabel } from '../../datasetLandingPage/lib/viewCardHelpers';

const TableResult = (props) => {
  return (
    <tr className="result">
      <td className="result-type" scope="row">
        {props.type}{/* TODO: localization */}
      </td>
      <td className="result-name">
        <a href={props.link}>
          {props.name}
        </a>
      </td>
      <td className="result-updated-date">
        {getDateLabel(props.updatedAt)}
      </td>
      <td className="result-popularity">
        {getViewCountLabel(props.viewCount)}
      </td>
    </tr>
  );
};

TableResult.propTypes = {
  name: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  updatedAt: PropTypes.string,
  viewCount: PropTypes.number.isRequired
};

TableResult.defaultProps = {
  link: '',
  name: '',
  type: '',
  viewCount: 0
};

export default TableResult;
