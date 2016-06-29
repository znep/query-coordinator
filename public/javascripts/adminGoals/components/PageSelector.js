import _ from 'lodash';
import React from 'react';
import { connect } from 'react-redux';
import { setCurrentPage } from '../actions/goalTableActions';
import classNames from 'classnames/bind';

class PageSelector extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let totalPageCount = _.max([1, _.ceil(this.props.totalGoalCount / this.props.rowsPerPage)]);
    let startOffset = this.props.rowsPerPage * (this.props.currentPage - 1);
    let maxIndex = startOffset + this.props.rowsPerPage;
    let endPosition = maxIndex > this.props.totalGoalCount ? this.props.totalGoalCount : maxIndex;

    let prevAvailable = this.props.currentPage > 1;
    let prevProps = { className: classNames('pageChangeIcon', 'icon-arrow-left', { disabled: !prevAvailable }) };
    if (prevAvailable) {
      prevProps.onClick = _.wrap(this.props.currentPage - 1, this.props.changePage);
    }

    let nextAvailable = this.props.currentPage < totalPageCount;
    let nextProps = { className: classNames('pageChangeIcon', 'icon-arrow-right', { disabled: !nextAvailable }) };
    if (nextAvailable) {
      nextProps.onClick = _.wrap(this.props.currentPage + 1, this.props.changePage);
    }

    let startLabel = startOffset == 0 ? 1 : startOffset;
    return <div className="pageSelectorContainer">
      <span className="labels">{ startLabel } - { endPosition } { this.props.translations.getIn(['admin', 'listing', 'of']) } { this.props.totalGoalCount }</span>
      <span { ...prevProps } />
      <span { ...nextProps } />
    </div>;
  }
}

const mapStateToProps = state => ({
  translations: state.getIn(['goalTableData', 'translations']),
  rowsPerPage: state.getIn(['goalTableData', 'rowsPerPage']),
  totalGoalCount: state.getIn(['goalTableData', 'totalGoalCount']),
  currentPage: state.getIn(['goalTableData', 'currentPage'])
});

const mapDispatchToProps = dispatch => ({
  changePage: page => dispatch(setCurrentPage(page))
});

export default connect(mapStateToProps, mapDispatchToProps)(PageSelector);
