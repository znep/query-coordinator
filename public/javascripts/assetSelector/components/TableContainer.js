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
            {/* Do we need to worry about these changing? */}
            {/* What about categories and tags? */}
            <th scope="col">Type</th>
            <th scope="col">Name</th>
            <th scope="col">Updated Date</th>
            <th scope="col">Popularity</th> {/* view count? */}
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
