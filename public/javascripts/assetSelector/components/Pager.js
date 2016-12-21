import React, { Component, PropTypes } from 'react';
import _ from 'lodash';

export class Pager extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['pageLinks']);
  }

  pageLinks() {
    const links = [];
    for (let pageNumber = this.props.pagerStart; pageNumber <= this.props.pagerEnd; pageNumber++) {
      const linkClasses = 'pageLink{0}'.format((this.props.currentPage === pageNumber) ? ' active' : '');
      const pageTranslation = 'Page'; // TODO: localization

      links.push(
        <a
          key={pageNumber}
          href={this.pageLinkHref(pageNumber)}
          className={linkClasses}
          title={`${pageTranslation} ${pageNumber}`}>
          <span className="accessible">{pageTranslation}</span>{pageNumber}
        </a>
      );
    }
    return links;
  }

  // TODO: move somewhere like assetSelector/lib/arrayHelpers.js ?
  arrayContainsSubstring(array, string) {
    let found = false;
    array.forEach((value) => {
      if (value.indexOf(string) > -1) {
        found = true;
      }
    });
    return found;
  }

  pageLinkHref(pageNumber) {
    const urlParams = window.location.search.slice(1).split('#')[0].split('&');
    let href = `${window.location.pathname}?`;
    if (this.arrayContainsSubstring(urlParams, 'page=')) {
      // `page` url param already exists, update its value
      href += urlParams.map((urlParam) => {
        const [key, val] = urlParam.split('=');
        if (key.toString().toLowerCase() === 'page') {
          return `page=${pageNumber}`;
        } else {
          return `${key}=${val}`;
        }
      }).join('&');
    } else {
      // Add `page` to url params
      const newUrlParams = urlParams.filter((param) => param);
      newUrlParams.push(`page=${pageNumber}`);
      href += newUrlParams.join('&');  // TODO! don't join with & if there are no other url params..
    }

    return href;
  }

  render() {
    return (
      <div className="results-pagination-controls">
        <div className="pagination">
          {this.pageLinks()}
          <span className="ellipses">...</span>

          {/* TODO: conditionally show First/Pevious/Next/Last buttons? */}
          <a href="#" className="next nextLink pagination-button" title="Next Page">
            <span className="icon">Next</span>
            <span className="accessible">page</span>
          </a>
          <a href="#" className="end lastLink pagination-button" title="Last Page">
            <span className="icon">Last</span>
            <span className="accessible">page</span>
          </a>
        </div>
      </div>
    );
  }
}

Pager.propTypes = {
  currentPage: PropTypes.number.isRequired,
  pagerStart: PropTypes.number.isRequired,
  pagerEnd: PropTypes.number.isRequired
};

Pager.defaultProps = {
  currentPage: 1,
  pagerStart: 1,
  pagerEnd: 9
};

export default Pager;
