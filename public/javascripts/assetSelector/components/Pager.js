import React, { Component, PropTypes } from 'react';
import ceteraUtils from '../lib/ceteraUtils';
import _ from 'lodash';

export class Pager extends Component {
  constructor(props) {
    super(props);
    _.bindAll(this, ['pageLinks', 'pageLinkClick']);
  }

  pageLinks() {
    const links = [];
    for (let pageNumber = this.props.pagerStart; pageNumber <= this.props.pagerEnd; pageNumber++) {
      const linkClasses = 'pageLink{0}'.format((this.props.currentPage === pageNumber) ? ' active' : '');
      const pageTranslation = 'Page'; // TODO: localization

      links.push(
        <a
          key={pageNumber}
          href="#"
          onClick={(e) => this.pageLinkClick(e, pageNumber)}
          className={linkClasses}
          title={`${pageTranslation} ${pageNumber}`}>
          <span className="accessible">{pageTranslation}</span>{pageNumber}
        </a>
      );
    }
    return links;
  }

  pageLinkClick(e, pageNumber) {
    e.preventDefault();
    // TODO: change "active" class on the links to the current link

    ceteraUtils().fetch({ pageNumber }).
      success(function(response) {
        console.log(response.results); // should probably have this callback way higher up, and pass it down to <Pager>.
                                      // from there, we can trigger a re-render of the results
      }).
      error(function(err) {
        // TODO. airbrake, return error message, etc.
        console.error(err);
      });

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
