import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import ceteraUtils from '../lib/ceteraUtils';
import { closeAssetSelector } from '../actions/modal';
import { updatePageResults } from '../actions/pageResults';
import { updateResultCount } from '../actions/resultCount';
import BackButton from './BackButton';
import Card from './Card';
import NoResults from './NoResults';
import Pager from './Pager';
import ResultCount from './ResultCount';
import SortDropdown from './SortDropdown';
import Spinner from './Spinner';

export class ResultsContainer extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['changePage', 'changeSort']);

    this.state = {
      sort: 'relevance',
      currentPage: 1,
      fetchingResults: false,
      pagerKey: 1
      /*
        pagerKey only exists so that the defaultValue of the Pager input field updates when the prev/next
        links are clicked. Otherwise, the input would not update due to how React treats defaultValue.
        We can't use `value` instead of defaultValue, because then the input wouldn't be controllable.
      */
    };
  }

  componentDidMount() {
    this.changePage(1); // Fetch the first page of results
  }

  changePage(pageNumber) {
    const { dispatchUpdatePageResults, dispatchUpdateResultCount } = this.props;
    this.setState({ fetchingResults: true });
    ceteraUtils.
      fetch({
        category: this.props.category,
        limit: this.props.resultsPerPage,
        order: this.state.sort,
        pageNumber
      }).
      success((response) => {
        const results = ceteraUtils.mapToAssetSelectorResult(response.results);
        dispatchUpdatePageResults(results);
        dispatchUpdateResultCount(response.resultSetSize);
        this.setState({ fetchingResults: false });
      }).
      error((err) => {
        // TODO. airbrake, return error message, etc.
        console.error(err);
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
    } else if (!this.props.results.length) {
      resultContent = <NoResults />;
    } else {
      resultContent = (
        <div>
          <div className="top-controls">
            <ResultCount
              currentPage={this.state.currentPage}
              resultsPerPage={this.props.resultsPerPage}
              total={this.props.resultCount} />

            <SortDropdown
              onSelection={this.changeSort}
              value={this.state.sort} />
          </div>

          <div className="card-container">
            {this.props.results.map((result, i) =>
              <Card key={i} {...result} />
            )}
          </div>

          <Pager
            key={this.state.pagerKey}
            currentPage={this.state.currentPage}
            changePage={this.changePage}
            resultCount={this.props.resultCount}
            resultsPerPage={this.props.resultsPerPage} />
        </div>
      );
    }

    return (
      <div className="modal-content results-container">
        <div className="centered-content">
          <div className="results-topbar">
            <BackButton onClick={this.props.dispatchCloseAssetSelector} />
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
  results: PropTypes.array.isRequired,
  dispatchCloseAssetSelector: PropTypes.func.isRequired,
  dispatchUpdatePageResults: PropTypes.func.isRequired,
  dispatchUpdateResultCount: PropTypes.func.isRequired,
  resultCount: PropTypes.number.isRequired,
  resultsPerPage: PropTypes.number.isRequired
};

ResultsContainer.defaultProps = {
  additionalTopbarComponents: [],
  category: null,
  results: [],
  dispatchCloseAssetSelector: _.noop,
  dispatchUpdatePageResults: _.noop,
  dispatchUpdateResultCount: _.noop,
  resultCount: 0,
  resultsPerPage: 6
};

function mapStateToProps(state) {
  return {
    resultCount: _.get(state, 'assetSelector.resultCount.count'),
    results: _.get(state, 'assetSelector.pageResults.results')
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchCloseAssetSelector: function() {
      dispatch(closeAssetSelector());
    },
    dispatchUpdatePageResults: function(newPageResults) {
      dispatch(updatePageResults(newPageResults));
    },
    dispatchUpdateResultCount: function(newResultCount) {
      dispatch(updateResultCount(newResultCount));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultsContainer);
