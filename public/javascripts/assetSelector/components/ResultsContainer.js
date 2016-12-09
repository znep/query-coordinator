import React, { Component, PropTypes } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { changeViewType } from '../actions/viewType';
import NoResults from './NoResults';
import TableContainer from './TableContainer';
import ViewCount from './ViewCount';
// import ViewCardsContainer from './ViewCardsContainer'

export class ResultsContainer extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['onViewTypeClick', 'renderResults']);
  }

  onViewTypeClick(newViewType) {
    return () => {
      this.props.changeViewType(newViewType);
    };
  }

  renderResults() {
    if (this.props.viewType === 'CARD_VIEW') {
      return (
        <div>
          <p>im cards</p>
        </div>
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
        <div>
          <a href="#" onClick={this.onViewTypeClick('CARD_VIEW')}>Card view</a> |
          <a href="#" onClick={this.onViewTypeClick('TABLE_VIEW')}>Table view</a>

          <ViewCount count={this.props.viewCount} />

          {this.renderResults()}
        </div>
      );
    }
  }
}

ResultsContainer.propTypes = {
  results: PropTypes.array.isRequired,
  changeViewType: PropTypes.func.isRequired,
  viewCount: PropTypes.number.isRequired,
  viewType: PropTypes.string.isRequired
};

ResultsContainer.defaultProps = {
  results: [],
  changeViewType: _.noop,
  viewCount: 0,
  viewType: 'CARD_VIEW'
};

function mapStateToProps(state) {
  return {
    viewType: _.get(state, 'viewType.type')
  };
}

function mapDispatchToProps(dispatch) {
  return {
    changeViewType: function(newViewType) {
      dispatch(changeViewType(newViewType));
    }
  };
}

export default connect(mapStateToProps, mapDispatchToProps)(ResultsContainer);
