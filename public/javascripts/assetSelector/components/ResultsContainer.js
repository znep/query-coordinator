import React, { PropTypes, Component } from 'react';
import { connect } from 'react-redux';
import _ from 'lodash';
import { changeViewType } from '../actions/viewType';
import NoResults from './NoResults';
// import TableContainer from './TableContainer';
// import ViewCardsContainer from './ViewCardsContainer'

export class ResultsContainer extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['onViewTypeClick']);
  }

  onViewTypeClick(newViewType) {
    return () => {
      this.props.changeViewType(newViewType);
    };
  }

  render() {
    if (!this.props.results.length) {
      return (
        <NoResults />
      );
    } else {
      return (
        <div>
          <a href="#" onClick={this.onViewTypeClick('CARD_VIEW')}>Card view</a>
          or
          <a href="#" onClick={this.onViewTypeClick('TABLE_VIEW')}>Table view</a>
          <div>
            Current: {this.props.viewType}
          </div>
         {  /* TODO: render either TableContainer or ViewCardsContainer */ }
        </div>
      );
    }
  }
}

ResultsContainer.propTypes = {
  results: PropTypes.array.isRequired,
  changeViewType: PropTypes.func.isRequired,
  viewType: PropTypes.string.isRequired
};

ResultsContainer.defaultProps = {
  results: [],
  changeViewType: _.noop,
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
