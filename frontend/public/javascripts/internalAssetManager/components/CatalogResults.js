import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import ResultListTable from './ResultListTable';
import Pager from '../../common/components/Pager';
import ResultCount from './ResultCount';
import { changePage } from '../actions/pager';
import _ from 'lodash';

const RESULTS_PER_PAGE = 10;

export class CatalogResults extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      tableView: 'list'
    };

    _.bindAll(this, [
      'changePage',
      'renderError',
      'renderFooter',
      'renderTable',
      'renderTopbar'
    ]);
  }

  changePage(pageNumber) {
    this.props.changePage(pageNumber);
  }

  renderError() {
    if (this.props.fetchingResultsError) {
      return (
        <div className="alert error">
          {_.get(I18n, 'errors.fetching_results')}
        </div>
      );
    }
  }

  renderTopbar() {
    return (
      <div className="topbar">
        <input type="text" placeholder="Search" />{/* TODO: autocomplete searchbar */}
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
    const { currentPage, fetchingResults, resultSetSize } = this.props;
    if (fetchingResults) {
      return;
    }

    const pagerProps = {
      changePage: this.changePage,
      currentPage,
      resultCount: resultSetSize,
      resultsPerPage: RESULTS_PER_PAGE
    };

    const resultCountProps = {
      currentPage,
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
  changePage: PropTypes.func.isRequired,
  currentPage: PropTypes.number,
  fetchingResults: PropTypes.bool,
  fetchingResultsError: PropTypes.bool,
  order: PropTypes.object,
  resultSetSize: PropTypes.number.isRequired
};

CatalogResults.defaultProps = {
  currentPage: 1,
  fetchingResults: false,
  fetchingResultsError: false
};

const mapStateToProps = state => ({
  currentPage: state.catalog.currentPage,
  fetchingResults: state.catalog.fetchingResults,
  fetchingResultsError: state.catalog.fetchingResultsError,
  order: state.catalog.order,
  resultSetSize: state.catalog.resultSetSize
});

const mapDispatchToProps = dispatch => ({
  changePage: (pageNumber) => dispatch(changePage(pageNumber))
});

export default connect(mapStateToProps, mapDispatchToProps)(CatalogResults);
