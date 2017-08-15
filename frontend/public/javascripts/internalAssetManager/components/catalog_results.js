import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';

import ResultListTable from './result_list_table';
import Pager from 'common/components/Pager';
import ResultCount from './result_count';
import * as pager from '../actions/pager';
import * as filters from '../actions/filters';
import Autocomplete from 'common/autocomplete/components/Autocomplete';
import { getCeteraResults } from 'common/autocomplete/Util';
import ClearFilters from './clear_filters';

const RESULTS_PER_PAGE = 10;

export class CatalogResults extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tableView: 'list'
    };

    _.bindAll(this,
      'renderError',
      'renderFooter',
      'renderTable',
      'renderTopbar'
    );
  }

  renderError() {
    if (this.props.fetchingResultsError) {
      const subkey = _.get(this.props, 'fetchingResultsErrorType', 'fetching_results');
      const errorMessageTranslationKey = `errors.${subkey}`;

      return (
        <div className="alert error">
          {_.get(I18n, errorMessageTranslationKey)}
        </div>
      );
    }
  }

  renderTopbar() {
    const autocompleteOptions = {
      animate: true,
      anonymous: false,
      collapsible: false,
      currentQuery: this.props.currentQuery,
      getSearchResults: getCeteraResults,
      millisecondsBeforeSearch: 60,
      mobile: false,
      onChooseResult: this.props.changeQ,
      onClearSearch: this.props.clearSearch
    };

    const { allFilters, clearAllFilters, clearSearch } = this.props;

    const clearFiltersProps = {
      allFilters,
      buttonStyle: true,
      clearAllFilters,
      clearSearch,
      showTitle: false
    };

    return (
      <div className="topbar clearfix">
        <Autocomplete {...autocompleteOptions} />
        <ClearFilters {...clearFiltersProps} />
      </div>
    );
  }

  renderTable() {
    const { fetchingResults } = this.props;
    const { tableView } = this.state;

    if (fetchingResults) {
      return (
        <div className="catalog-results-spinner-container">
          <span className="spinner-default spinner-large"></span>
        </div>
      );
    }

    if (tableView === 'list') {
      return <ResultListTable />;
    } else {
      // Currently only support for the "list" view. TODO: add "card" view and the ability to toggle them.
      // return <ResultCardTable />;
    }
  }

  renderFooter() {
    const { pageNumber, fetchingResults, resultSetSize } = this.props;
    if (fetchingResults) {
      return;
    }

    const pagerProps = {
      changePage: this.props.changePage,
      currentPage: pageNumber,
      resultCount: resultSetSize,
      resultsPerPage: RESULTS_PER_PAGE
    };

    const resultCountProps = {
      pageNumber,
      resultsPerPage: RESULTS_PER_PAGE,
      total: resultSetSize
    };

    return (
      <div className="catalog-footer">
        <Pager {...pagerProps} />
        <ResultCount {...resultCountProps} />
      </div>
    );
  }

  render() {
    return (
      <div className="catalog-results">
        {this.renderTopbar()}
        {this.renderError()}
        {this.renderTable()}
        {this.renderFooter()}
      </div>
    );
  }
}

CatalogResults.propTypes = {
  allFilters: PropTypes.object,
  changePage: PropTypes.func.isRequired,
  changeQ: PropTypes.func.isRequired,
  clearSearch: PropTypes.func,
  clearAllFilters: PropTypes.func.isRequired,
  currentQuery: PropTypes.string,
  fetchingResults: PropTypes.bool,
  fetchingResultsError: PropTypes.bool,
  fetchingResultsErrorType: PropTypes.string,
  order: PropTypes.object,
  pageNumber: PropTypes.number,
  resultSetSize: PropTypes.number.isRequired
};

CatalogResults.defaultProps = {
  currentQuery: '',
  fetchingResults: false,
  fetchingResultsError: false,
  pageNumber: 1
};

const mapStateToProps = (state) => ({
  allFilters: state.filters,
  currentQuery: state.filters.q,
  fetchingResults: state.catalog.fetchingResults,
  fetchingResultsError: state.catalog.fetchingResultsError,
  fetchingResultsErrorType: state.catalog.fetchingResultsErrorType,
  order: state.catalog.order,
  pageNumber: state.catalog.pageNumber,
  resultSetSize: state.catalog.resultSetSize
});

const mapDispatchToProps = (dispatch) => ({
  changePage: (pageNumber) => dispatch(pager.changePage(pageNumber)),
  changeQ: (query) => dispatch(filters.changeQ(query)),
  clearAllFilters: (shouldClearSearch) => dispatch(filters.clearAllFilters(shouldClearSearch)),
  clearSearch: () => dispatch(filters.clearSearch())
});

export default connect(mapStateToProps, mapDispatchToProps)(CatalogResults);
