import React from 'react';
import ResultsContainer from './components/ResultsContainer';

export default () => (
  <div>
    <ResultsContainer
      results={window.assetSelectorContent.results}
      viewCount={window.assetSelectorContent.view_count}
      facets={window.assetSelectorContent.facets} />
  </div>
);
