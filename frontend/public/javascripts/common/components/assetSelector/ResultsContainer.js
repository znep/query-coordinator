import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';
import ceteraUtils from 'common/cetera/utils';
import BackButton from '../BackButton';
import Card from './Card';
import NoResults from './NoResults';
import Pager from '../Pager';
import ResultCount from './ResultCount';
import Searchbox from '../searchbox/Searchbox';
import SortDropdown from './SortDropdown';
import Spinner from './Spinner';
import I18n from 'common/i18n';

export class ResultsContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentPage: 1,
      fetchingResults: false,
      isMounted: true,
      resultCount: 0,
      results: [],
      sort: 'relevance',
      query: undefined
    };

    _.bindAll(this, ['changePage', 'changeSort', 'changeQuery']);
  }

  componentDidMount() {
    this.changePage(1); // Fetch the first page of results
  }

  componentWillUnmount() {
    this.setState({ isMounted: false });
  }

  changePage(pageNumber) {
    if (this.state.isMounted) {
      this.setState({ fetchingResults: true });

      const { catalogQuery } = this.props;
      const categoryFilter = catalogQuery.category;
      const assetTypeFilter = catalogQuery.limitTo;

      const customMetadataFilters = _.omit(catalogQuery, ['category', 'custom_path', 'limitTo', 'tags']);

      ceteraUtils.
        query({
          category: categoryFilter,
          customMetadataFilters,
          limit: this.props.resultsPerPage,
          only: assetTypeFilter,
          order: this.state.sort,
          pageNumber,
          q: this.state.query
        }).
        then((response) => {
          if (_.isObject(response)) {
            const results = ceteraUtils.mapToAssetSelectorResult(response.results);
            this.setState({ fetchingResults: false, results, resultCount: response.resultSetSize });
          } else {
            this.setState({ fetchingResults: false, results: [], resultCount: 0, errorMessage: response });
          }
        }).
        catch(() => {
          this.setState({ fetchingResults: false });
        });

      this.setState({
        currentPage: parseInt(pageNumber, 10)
      });
    }
  }

  changeSort(option) {
    this.setState({
      sort: option.value
    }, () => this.changePage(1));
  }

  changeQuery(query) {
    this.setState({ query }, () => this.changePage(1));
  }

  render() {
    let resultContent;

    if (this.state.fetchingResults) {
      resultContent = <Spinner />;
    } else if (this.state.errorMessage) {
      resultContent = <div className="alert error">{this.state.errorMessage}</div>;
    } else if (!this.state.results.length) {
      resultContent = <NoResults />;
    } else {
      resultContent = (
        <div>
          <div className="top-controls">
            <ResultCount
              currentPage={this.state.currentPage}
              resultsPerPage={this.props.resultsPerPage}
              total={this.state.resultCount} />

            <SortDropdown
              onSelection={this.changeSort}
              value={this.state.sort} />
          </div>

          <div className="card-container">
            {this.state.results.map((result, i) =>
              <Card key={i} {...result} onClose={this.props.onClose} onSelect={this.props.onSelect} />
            )}
          </div>

          <Pager
            changePage={this.changePage}
            currentPage={this.state.currentPage}
            resultCount={this.state.resultCount}
            resultsPerPage={this.props.resultsPerPage} />
        </div>
      );
    }

    return (
      <div className="results-container">
        <div className="centered-content">
          <div className="results-topbar">
            <BackButton onClick={this.props.onClose} />
            {this.props.additionalTopbarComponents.map((component) => component)}
            <Searchbox
              onSearch={this.changeQuery}
              placeholder={I18n.t('common.asset_selector.results_container.search')} />
          </div>
          {resultContent}
        </div>
      </div>
    );
  }
}

ResultsContainer.propTypes = {
  additionalTopbarComponents: PropTypes.array,
  catalogQuery: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  resultsPerPage: PropTypes.number.isRequired
};

ResultsContainer.defaultProps = {
  additionalTopbarComponents: [],
  catalogQuery: {},
  onClose: _.noop,
  onSelect: _.noop,
  resultsPerPage: 6
};

export default ResultsContainer;
