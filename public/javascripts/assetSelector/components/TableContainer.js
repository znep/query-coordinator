import React, { PropTypes } from 'react';
import TableResult from './TableResult';

export const TableContainer = (props) => {
  const results = props.results.map((result, i) =>
    <TableResult key={i} data={result.data} />
  );

  return (
    <div className="results-container table-responsive">
      <table className="table">
        <thead>
          <tr>
            <th scope="col">Type</th>
            <th scope="col">Name</th>
            <th scope="col">Updated Date</th>
            <th scope="col">Popularity</th> {/* view count? */}
            {/* What about categories/tags? */}
          </tr>
        </thead>
        <tbody>
          {results}
        </tbody>
      </table>
    </div>
  );
};

TableContainer.propTypes = {
  results: PropTypes.array.isRequired
};

TableContainer.defaultProps = {
  results: []
};

export default TableContainer;
