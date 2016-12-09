import React from 'react';
import ResultsContainer from './components/ResultsContainer';

export default () => (
  <div>
    {/* TODO: instead of this, we need an inbetween container component that decides to show
      a certain view: grid vs table view.
      Then rename ResultsContainer to TableContainer, and rename Result to TableResult or something.
      and make a GridContainer, which contains Tile/Grid/whatever we want to call those. ask DJ?
    */}
    <ResultsContainer results={window.assetSelectorContent.results} />
  </div>
);
