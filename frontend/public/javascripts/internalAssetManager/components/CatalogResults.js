import React, { PropTypes } from 'react';
import { connect } from 'react-redux';
import ResultListTable from './ResultListTable';
import Pager from '../../common/components/Pager';
import ResultCount from './ResultCount';
import * as Actions from '../actions/catalog';
import ceteraUtils from '../../common/ceteraUtils';

const RESULTS_PER_PAGE = 10;

export class CatalogResults extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentPage: 1,
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
    this.setState({ fetchingResults: true, errorMessage: null });

    ceteraUtils.
      fetch({
        // TODO: get filters from redux. shaped like:
        // category: categoryFilter,
        // customMetadataFilters,
        // limit: this.props.resultsPerPage,
        // only: assetTypeFilter,
        // order: this.state.sort,
        // q: this.state.query
        limit: RESULTS_PER_PAGE,
        pageNumber
      }).
      then((response) => {
        this.setState({ fetchingResults: false });
        if (_.isObject(response)) {
          this.props.updateCatalogResults(response);
        } else {
          this.setState({ errorMessage: response });
        }
      }).
      catch((error) => {
        this.setState({
          errorMessage: error,
          fetchingResults: false
        });
      });

    this.setState({
      currentPage: parseInt(pageNumber, 10)
    });
  }

  renderError() {
    if (this.state.errorMessage) {
      return (
        <div className="alert error">
          {_.get(I18n, 'errors.fetching_results')}
        </div>
      );
    }
  }

  renderTopbar() {
    return <div className="topbar">TODO: Searchbar</div>;
  }

  renderTable() {
    const { fetchingResults, tableView } = this.state;

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
    if (this.state.fetchingResults) {
      return;
    }

    const { resultSetSize } = this.props;
    const { currentPage } = this.state;

    const pagerProps = {
      changePage: this.changePage,
      currentPage: currentPage,
      resultCount: resultSetSize,
      resultsPerPage: RESULTS_PER_PAGE
    };

    const resultCountProps = {
      currentPage: currentPage,
      resultsPerPage: RESULTS_PER_PAGE,
      total: resultSetSize
    };

    return (
      <div>
        <Pager {...pagerProps} />
        <ResultCount {...resultCountProps} />
      </div>
    );
  }

  render() {
    return (
      <div className="catalog-results">
        {this.renderError()}
        {this.renderTopbar()}
        {this.renderTable()}
        {this.renderFooter()}
      </div>
    );
  }
}

CatalogResults.propTypes = {
  updateCatalogResults: PropTypes.func.isRequired,
  resultSetSize: PropTypes.number.isRequired
};

const mapStateToProps = state => ({
  resultSetSize: state.catalog.resultSetSize
});

const mapDispatchToProps = dispatch => ({
  updateCatalogResults: (ceteraResponse) => dispatch(Actions.updateCatalogResults(ceteraResponse))
});

export default connect(mapStateToProps, mapDispatchToProps)(CatalogResults);
