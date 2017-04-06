import React, { PropTypes } from 'react';
import _ from 'lodash';
import ceteraUtils from '../../ceteraUtils';
import BackButton from '../BackButton';
import Card from './Card';
import NoResults from './NoResults';
import Pager from '../Pager';
import ResultCount from './ResultCount';
import Searchbox from '../searchbox/Searchbox';
import SortDropdown from './SortDropdown';
import Spinner from './Spinner';

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
      query: ''
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
      ceteraUtils.
        fetch({
          category: this.props.category,
          limit: this.props.resultsPerPage,
          order: this.state.sort,
          pageNumber,
          q: this.state.query
        }).
        then((response) => {
          const results = ceteraUtils.mapToAssetSelectorResult(response.results);
          this.setState({ fetchingResults: false, results, resultCount: response.resultSetSize });
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
              placeholder={_.get(I18n, 'common.asset_selector.results_container.search_this_category')} />
          </div>
          {resultContent}
        </div>
      </div>
    );
  }
}

ResultsContainer.propTypes = {
  additionalTopbarComponents: PropTypes.array,
  category: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSelect: PropTypes.func.isRequired,
  resultsPerPage: PropTypes.number.isRequired
};

ResultsContainer.defaultProps = {
  additionalTopbarComponents: [],
  category: null,
  onClose: _.noop,
  onSelect: _.noop,
  resultsPerPage: 6
};

export default ResultsContainer;
