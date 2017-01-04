import React, { Component, PropTypes } from 'react';
import _ from 'lodash';

export class Pager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1
    };
    _.bindAll(this, ['pageLinks', 'pageLinkClick']);
  }

  pageLinks() {
    const links = [];
    for (let pageNumber = this.props.pagerStart; pageNumber <= this.props.pagerEnd; pageNumber++) {
      const linkClasses = 'pageLink{0}'.format((this.state.currentPage === pageNumber) ? ' active' : '');
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
    this.props.onPageChange(pageNumber);
    this.setState({
      currentPage: pageNumber
    });
  }

  render() {
    return (
      <div className="results-pagination-controls">
        <div className="pagination">
          {this.pageLinks()}
          <span className="ellipses">...</span>

          {/* TODO: conditionally show First/Pevious/Next/Last buttons? */}
          <a href="#" className="next nextLink pagination-button" title="Next Page">{/* TODO: Localization */}
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
  onPageChange: PropTypes.func.isRequired,
  pagerStart: PropTypes.number.isRequired,
  pagerEnd: PropTypes.number.isRequired
};

Pager.defaultProps = {
  onPageChange: _.noop,
  pagerStart: 1,
  pagerEnd: 9
};

export default Pager;
