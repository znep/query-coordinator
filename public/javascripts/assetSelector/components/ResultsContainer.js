import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { updatePageResults } from '../actions/pageResults';
import { changeViewType } from '../actions/viewType';
import { updateResultCount } from '../actions/resultCount';
import NoResults from './NoResults';
import ResultCount from './ResultCount';
import CardContainer from './CardContainer';
import TableContainer from './TableContainer';
import PagerWrapper from './PagerWrapper';
import ceteraUtils from '../lib/ceteraUtils';

export class ResultsContainer extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['onViewTypeClick', 'onPageChange', 'renderResults']);
    this.onPageChange(1); // Fetch the first page of results
    // This may be something we want to make a prop, so one could open the assets at a given page
    // (based on something like a URL param), useful if this becomes a replacement for the catalog.
  }

  onViewTypeClick(newViewType) {
    return () => {
      this.props.dispatchChangeViewType(newViewType);
    };
  }

  onPageChange(pageNumber) {
    const { dispatchUpdatePageResults, dispatchUpdateResultCount } = this.props;
    ceteraUtils.fetch({ pageNumber }).
      success((response) => {
        const results = ceteraUtils.mapToAssetSelectorResult(response.results);
        dispatchUpdatePageResults(results);
        dispatchUpdateResultCount(response.resultSetSize);
        // TODO: scroll up?
      }).
      error((err) => {
        // TODO. airbrake, return error message, etc.
        console.error(err);
      });
  }

  renderResults() {
    if (this.props.viewType === 'CARD_VIEW') {
      return (
        <CardContainer results={this.props.results} />
      );
    } else {
      return (
        <TableContainer results={this.props.results} />
      );
    }
  }

  render() {
    if (!this.props.results.length) {
      return (
        <NoResults />
      );
    } else {
      return (
        <div className="results-container">
          <a href="#" onClick={this.onViewTypeClick('CARD_VIEW')}>Card view</a> |
          <a href="#" onClick={this.onViewTypeClick('TABLE_VIEW')}>Table view</a>

          <ResultCount count={this.props.resultCount} />

          {this.renderResults()}
          <PagerWrapper resultCount={this.props.resultCount} onPageChange={this.onPageChange} />
        </div>
      );
    }
  }
}

ResultsContainer.propTypes = {
  results: PropTypes.array.isRequired,
  dispatchChangeViewType: PropTypes.func.isRequired,
  dispatchUpdatePageResults: PropTypes.func.isRequired,
  dispatchUpdateResultCount: PropTypes.func.isRequired,
  resultCount: PropTypes.number.isRequired,
  viewType: PropTypes.string.isRequired
};

ResultsContainer.defaultProps = {
  results: [],
  dispatchChangeViewType: _.noop,
  dispatchUpdatePageResults: _.noop,
  dispatchUpdateResultCount: _.noop,
  resultCount: 0,
  viewType: 'CARD_VIEW'
};

function mapStateToProps(state) {
  return {
    resultCount: _.get(state, 'resultCount.count'),
    viewType: _.get(state, 'viewType.type'),
    results: _.get(state, 'pageResults.results')
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchChangeViewType: function(newViewType) {
      dispatch(changeViewType(newViewType));
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
