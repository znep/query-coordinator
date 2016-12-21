import React, { Component, PropTypes } from 'react';
import Pager from './Pager';

export class PagerWrapper extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['getCurPage', 'getPagerStart', 'getPagerEnd']);
  }

  // Returns current page number in the url param. Note: this is 1-indexed
  getCurPage() {
    const urlParams = window.location.search.slice(1).split('#')[0].split('&');
    urlParams.forEach((urlParam) => {
      const [key, val] = urlParam.split('=');
      if (key.toString().toLowerCase() === 'page' && val) return parseInt(val, 10);
    });
    return 1;
  }

  // Index of first page
  getPagerStart() {
    return 1; // TODO: determine correct pagerStart
  }

  // Index of last page (inclusive)
  getPagerEnd() {
    return 9; // TODO: determine correct pagerEnd
  }

  render() {
    return (<Pager
      currentPage={this.getCurPage()}
      pagerStart={this.getPagerStart()}
      pagerEnd={this.getPagerEnd()} />);
  }
}

PagerWrapper.propTypes = {
  viewCount: PropTypes.number.isRequired
};

PagerWrapper.defaultProps = {
  viewCount: 0
};

export default PagerWrapper;
