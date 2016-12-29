import React, { Component, PropTypes } from 'react';
import Pager from './Pager';
import _ from 'lodash';

export class PagerWrapper extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['getCurPage', 'getPagerStart', 'getPagerEnd']);
  }

  // Returns current page number in the url hash. Note: this is 1-indexed
  getCurPage() {
    const urlHashes = window.location.hash.split('#').slice(1);
    let page = 1;
    urlHashes.forEach((urlHash) => {
      const [key, val] = urlHash.split('=');
      if (key.toString().toLowerCase() === 'page' && val) page = parseInt(val, 10);
    });
    return page;
  }

  // Index of first page
  getPagerStart() {
    return 1; // TODO: determine correct pagerStart using this.props.viewCount
  }

  // Index of last page (inclusive)
  getPagerEnd() {
    return 9; // TODO: determine correct pagerEnd using this.props.viewCount
  }

  render() {
    return (<Pager
      {/* TODO: refactor this so currentPage is on state.. and gets updated */}
      currentPage={this.getCurPage()}
      onPageChange={this.props.onPageChange}
      pagerStart={this.getPagerStart()}
      pagerEnd={this.getPagerEnd()} />);
  }
}

PagerWrapper.propTypes = {
  onPageChange: PropTypes.func.isRequired,
  viewCount: PropTypes.number.isRequired
};

PagerWrapper.defaultProps = {
  onPageChange: _.noop,
  viewCount: 0
};

export default PagerWrapper;
