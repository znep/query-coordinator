import React, { PropTypes } from 'react';
import Card from './Card';

export const CardContainer = (props) => {
  const results = props.results.map((result, i) =>
    <Card key={i} data={result.data} />
  );

  return (
    <div className="card-container">
      {results}
    </div>
  );
};

CardContainer.propTypes = {
  results: PropTypes.array.isRequired
};

CardContainer.defaultProps = {
  results: []
};

export default CardContainer;
