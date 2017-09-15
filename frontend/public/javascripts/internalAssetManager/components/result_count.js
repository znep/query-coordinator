import PropTypes from 'prop-types';
import React from 'react';
import { getResultCountLabel } from 'common/helpers/viewCardHelpers';

export class ResultCount extends React.Component {
  render() {
    const { pageNumber, resultsPerPage, total } = this.props;
    const first = (pageNumber - 1) * resultsPerPage + 1;
    const last = Math.min(pageNumber * resultsPerPage, total);
    const resultLabel = getResultCountLabel(total);

    /* TODO: localize with i18n-js */
    const resultCountText = (total > 0) ?
      `${first}-${last} ${_.get(I18n, 'result_count.of')} ${resultLabel}` :
      _.get(I18n, 'result_count.no_results');

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
