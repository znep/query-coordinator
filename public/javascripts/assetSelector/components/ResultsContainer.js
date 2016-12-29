import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { pageResults } from '../actions/pageResults';
import { changeViewType } from '../actions/viewType';
import NoResults from './NoResults';
import ViewCount from './ViewCount';
import CardContainer from './CardContainer';
import TableContainer from './TableContainer';
import PagerWrapper from './PagerWrapper';
import ceteraUtils from '../lib/ceteraUtils';

export class ResultsContainer extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['onViewTypeClick', 'onPageChange', 'renderResults']);
    this.onPageChange(1); // Fetch the first page of results
  }

  onViewTypeClick(newViewType) {
    return () => {
      this.props.dispatchChangeViewType(newViewType);
    };
  }

  onPageChange(pageNumber) {
    const { dispatchPageResults } = this.props;
    ceteraUtils.fetch({ pageNumber }).
      success((response) => {
        const results = ceteraUtils.mapToAssetSelectorResult(response.results);
        dispatchPageResults(results);
        // TODO: scroll up?
        // TODO: update pager "active" number
        // TODO: update hash in url
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

          <ViewCount count={this.props.viewCount} />

          {this.renderResults()}
          <PagerWrapper viewCount={this.props.viewCount} onPageChange={this.onPageChange} />
        </div>
      );
    }
  }
}

ResultsContainer.propTypes = {
  results: PropTypes.array.isRequired,
  dispatchChangeViewType: PropTypes.func.isRequired,
  dispatchPageResults: PropTypes.func.isRequired,
  viewCount: PropTypes.number.isRequired,
  viewType: PropTypes.string.isRequired
};

ResultsContainer.defaultProps = {
  results: [],
  dispatchChangeViewType: _.noop,
  dispatchPageResults: _.noop,
  viewCount: 0,
  viewType: 'CARD_VIEW'
};

function mapStateToProps(state) {
  return {
    viewType: _.get(state, 'viewType.type'),
    results: _.get(state, 'pageResults.results')
  };
}

function mapDispatchToProps(dispatch) {
  return {
    dispatchChangeViewType: function(newViewType) {
      dispatch(changeViewType(newViewType));
    },
    dispatchPageResults: function(newPageResults) {
      dispatch(pageResults(newPageResults));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultsContainer);
