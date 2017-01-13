import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import $ from 'jquery';
import { updatePageResults } from '../actions/pageResults';
import { updateResultCount } from '../actions/resultCount';
import NoResults from './NoResults';
import ResultCount from './ResultCount';
import CardContainer from './CardContainer';
import Pager from './Pager';
import ceteraUtils from '../lib/ceteraUtils';

export class ResultsContainer extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['onPageChange']);
    this.onPageChange(1, true); // Fetch the first page of results
    // This may be something we want to make a prop, so one could open the assets at a given page
    // (based on something like a URL param), useful if this becomes a replacement for the catalog.
  }

  onPageChange(pageNumber, initialFetch = false) {
    const { dispatchUpdatePageResults, dispatchUpdateResultCount } = this.props;
    ceteraUtils.fetch({ pageNumber, limit: this.props.resultsPerPage }).
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
  }

  render() {
    if (!this.props.results.length) {
      return (
        <NoResults />
      );
    } else {
      return (
        <div className="results-container">
          <ResultCount count={this.props.resultCount} />

          <CardContainer results={this.props.results} />

          <Pager
            resultCount={this.props.resultCount}
            onPageChange={this.onPageChange}
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
