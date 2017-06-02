import React, { PropTypes } from 'react';
import { getViewCountLabel } from '../../common/helpers/viewCardHelpers';

export class ResultCount extends React.Component {
  render() {
    const { currentPage, resultsPerPage, total } = this.props;
    const first = (currentPage - 1) * resultsPerPage + 1;
    const last = Math.min(currentPage * resultsPerPage, total);
    const totalLabel = getViewCountLabel(total);

    /* TODO: localize with i18n-js */
    const resultCountText = (total > 0) ?
      `${first}-${last} ${_.get(I18n, 'result_count.of')} ${totalLabel}` :
      _.get(I18n, 'result_count.no_results');

    return (
      <div className="result-count">
        {resultCountText}
      </div>
    );
  }
}

ResultCount.propTypes = {
  currentPage: PropTypes.number.isRequired,
  resultsPerPage: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired
};

export default ResultCount;
