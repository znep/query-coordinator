import PropTypes from 'prop-types';
import React, { Component } from 'react';

import { getResultCountLabel } from 'frontend/public/javascripts/common/helpers/viewCardHelpers';
import I18n from 'common/i18n';

export class ResultCount extends Component {
  render() {
    const { pageNumber, resultsPerPage, total } = this.props;
    const first = (pageNumber - 1) * resultsPerPage + 1;
    const last = Math.min(pageNumber * resultsPerPage, total);
    const resultLabel = getResultCountLabel(total);

    const resultCountText = (total > 0) ?
      `${first}-${last} ${I18n.t('shared.asset_browser.result_count.of')} ${resultLabel}` :
      I18n.t('shared.asset_browser.result_count.no_results');

    return (
      <div className="result-count">
        {resultCountText}
      </div>
    );
  }
}

ResultCount.propTypes = {
  pageNumber: PropTypes.number.isRequired,
  resultsPerPage: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired
};

export default ResultCount;
