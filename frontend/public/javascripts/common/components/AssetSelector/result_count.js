import PropTypes from 'prop-types';
import React from 'react';
import I18n from 'common/i18n';
import { getResultCountLabel } from '../../helpers/viewCardHelpers';

export class ResultCount extends React.Component {
  render() {
    const { currentPage, resultsPerPage, total } = this.props;
    const pageResults = {
      first: (currentPage - 1) * resultsPerPage + 1,
      last: Math.min(currentPage * resultsPerPage, total)
    };

    return (
      <div className="result-count">
        {pageResults.first}-{pageResults.last}
        {` ${I18n.t('common.asset_selector.results_container.of')} `}
        {getResultCountLabel(total)}
      </div>
    );
  }
}

ResultCount.propTypes = {
  currentPage: PropTypes.number.isRequired,
  resultsPerPage: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired
};

ResultCount.defaultProps = {
  currentPage: 1,
  resultsPerPage: 6,
  total: 0
};

export default ResultCount;
