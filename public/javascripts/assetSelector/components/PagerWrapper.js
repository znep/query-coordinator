import React, { Component, PropTypes } from 'react';
import Pager from './Pager';
import _ from 'lodash';

export class PagerWrapper extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['getPagerStart', 'getPagerEnd']);
  }

  // Index of first page
  getPagerStart() {
    return 1; // TODO: determine correct pagerStart using this.props.resultCount
  }

  // Index of last page (inclusive)
  getPagerEnd() {
    return 9; // TODO: determine correct pagerEnd using this.props.resultCount
  }

  render() {
    return (<Pager
      onPageChange={this.props.onPageChange}
      pagerStart={this.getPagerStart()}
      pagerEnd={this.getPagerEnd()} />);
  }
}

PagerWrapper.propTypes = {
  onPageChange: PropTypes.func.isRequired,
  resultCount: PropTypes.number.isRequired
};

PagerWrapper.defaultProps = {
  onPageChange: _.noop,
  resultCount: 0
};

export default PagerWrapper;
