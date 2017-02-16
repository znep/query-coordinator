import React, { PropTypes } from 'react';
import _ from 'lodash';
import ceteraUtils from '../../ceteraUtils';
import BackButton from './BackButton';
import Card from './Card';
import NoResults from './NoResults';
import Pager from './Pager';
import ResultCount from './ResultCount';
import SortDropdown from './SortDropdown';
import Spinner from './Spinner';

export class ResultsContainer extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      currentPage: 1,
      fetchingResults: false,
      pagerKey: 1,
      /*
        pagerKey exists so that the defaultValue of the Pager input field updates when the prev/next
        links are clicked. Otherwise, the input would not update due to how React treats defaultValue.
        We can't use `value` instead of defaultValue, because then the input wouldn't be controllable.
      */
      resultCount: 0,
      results: [],
      sort: 'relevance'
    };

    _.bindAll(this, ['changePage', 'changeSort']);
  }

  componentDidMount() {
    this.changePage(1); // Fetch the first page of results
  }

  changePage(pageNumber) {
    this.setState({ fetchingResults: true });
    ceteraUtils.
      fetch({
        category: this.props.category,
        limit: this.props.resultsPerPage,
        order: this.state.sort,
        pageNumber
      }).
      then((response) => {
        const results = ceteraUtils.mapToAssetSelectorResult(response.results);
        this.setState({ fetchingResults: false, results, resultCount: response.resultSetSize });
      }).
      catch(() => {
        this.setState({ fetchingResults: false });
      });

    this.setState({
      currentPage: parseInt(pageNumber, 10),
      /* Increment the key to trigger a re-render of the Pager currentPageInput */
      pagerKey: this.state.pagerKey + 1
    });
  }

  changeSort(option) {
    this.setState({
      sort: option.value
    }, () => this.changePage(1));
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
            key={this.state.pagerKey}
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
