import React from 'react';
import ResultsContainer from './components/ResultsContainer';

export default () => (
  <div>
    <ResultsContainer results={window.assetSelectorContent.results} />
  </div>
);
