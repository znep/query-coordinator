import I18n from 'common/i18n';
import React from 'react';

export const NoResults = () => (
  <div className="no-results">
    <h2>{I18n.t('common.asset_selector.results_container.no_results')}</h2>
  </div>
);

export default NoResults;
