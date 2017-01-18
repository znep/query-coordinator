import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import $ from 'jquery';
import { updatePageResults } from '../actions/pageResults';
import { updateResultCount } from '../actions/resultCount';
import NoResults from './NoResults';
import ResultCount from './ResultCount';
import Card from './Card';
import Pager from './Pager';
import SortDropdown from './SortDropdown';
import ceteraUtils from '../lib/ceteraUtils';

export class ResultsContainer extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['changePage', 'changeSort']);

    this.state = {
      sort: 'relevance',
      currentPage: 1,
      pagerKey: 1
      /*
        pagerKey only exists so that the defaultValue of the Pager input field updates when the prev/next
        links are clicked. Otherwise, the input would not update due to how React treats defaultValue.
        We can't use `value` instead of defaultValue, because then the input wouldn't be controllable.
      */
    };
  }

  componentDidMount() {
    this.changePage(1, true); // Fetch the first page of results
  }

  changePage(pageNumber, initialFetch = false) {
    const { dispatchUpdatePageResults, dispatchUpdateResultCount } = this.props;
    ceteraUtils.fetch({ pageNumber, limit: this.props.resultsPerPage, order: this.state.sort }).
      success((response) => {
        const results = ceteraUtils.mapToAssetSelectorResult(response.results);
        dispatchUpdatePageResults(results);
        dispatchUpdateResultCount(response.resultSetSize);

        if (!initialFetch) {
          $('.asset-selector .content').animate({ scrollTop: 0 });
        }
      }).
      error((err) => {
        // TODO. airbrake, return error message, etc.
        console.error(err);
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
    if (!this.props.results.length) {
      return (
        <NoResults />
      );
    } else {
      return (
        <div className="results-container">
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
  }
}

ResultsContainer.propTypes = {
  results: PropTypes.array.isRequired,
  dispatchUpdatePageResults: PropTypes.func.isRequired,
  dispatchUpdateResultCount: PropTypes.func.isRequired,
  resultCount: PropTypes.number.isRequired,
  resultsPerPage: PropTypes.number.isRequired
};

ResultsContainer.defaultProps = {
  results: [],
  dispatchUpdatePageResults: _.noop,
  dispatchUpdateResultCount: _.noop,
  resultCount: 0,
  resultsPerPage: 6
};

function mapStateToProps(state) {
  return {
    resultCount: _.get(state, 'resultCount.count'),
    results: _.get(state, 'pageResults.results')
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchUpdatePageResults: function(newPageResults) {
      dispatch(updatePageResults(newPageResults));
    },
    dispatchUpdateResultCount: function(newResultCount) {
      dispatch(updateResultCount(newResultCount));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultsContainer);
