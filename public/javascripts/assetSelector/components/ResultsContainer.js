import React, { PropTypes } from 'react';
import NoResults from './NoResults';
import Result from './Result';

export const ResultsContainer = React.createClass({
  propTypes: {
    results: PropTypes.array.isRequired
  },

  resultsList() {
    const results = this.props.results.map((result, i) =>
      <Result key={i} data={result.data} />
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
  },

  render() {
    if (this.props.results.length > 0) {
      return this.resultsList();
    } else {
      return <NoResults />;
    }
  }
});

export default ResultsContainer;
