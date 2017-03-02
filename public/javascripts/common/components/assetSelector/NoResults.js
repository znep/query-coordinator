import React from 'react';

export const NoResults = () => (
  <div className="no-results">
    <h2>{_.get(I18n, 'common.asset_selector.results_container.no_results')}</h2>
  </div>
);

export default NoResults;
