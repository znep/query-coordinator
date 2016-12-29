import React from 'react';
import ResultsContainer from './components/ResultsContainer';

export default () => (
  <div>
    <ResultsContainer
      viewCount={window.assetSelectorContent.view_count} />
  </div>
);
