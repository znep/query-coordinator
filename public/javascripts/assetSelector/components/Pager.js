import React, { Component, PropTypes } from 'react';
import _ from 'lodash';

export class Pager extends Component {
  static get firstPage() {
    return 1;
  }

  // The number of page buttons we show in the pager
  static get maxPageLinks() {
    return 9;
  }

  static get pagerHalfwayPoint() {
    return Pager.maxPageLinks / 2.0;
  }

  static get resultsPerPage() {
    return 9;
  }

  constructor(props) {
    super(props);
    this.state = {
      currentPage: Pager.firstPage
    };
    _.bindAll(this, ['pagerStart', 'pagerEnd', 'lastPage', 'pageLinks', 'pageLinkClick']);
  }

  // First pager link to show
  pagerStart() {
    // If we are on a page > (the last page - the halfway point of maxPageLinks), we want to show additional
    // prev links so that we always show the maxPageLinks
    let additionalPrevLinkCount = 0;
    const breakpoint = this.lastPage() - Math.floor(Pager.pagerHalfwayPoint);
    if (this.state.currentPage > breakpoint) {
      additionalPrevLinkCount = this.state.currentPage - breakpoint;
    }

    // Make sure we don't exceed the firstPage
    return Math.max(
      this.state.currentPage - Math.floor(Pager.pagerHalfwayPoint) - additionalPrevLinkCount,
      Pager.firstPage
    );
  }

  // Last pager link to show
  pagerEnd() {
    // If we are on a page < the halfway point, we want to show additional next links so that we always
    // show the maxPageLinks
    let additionalNextLinkCount = 0;
    if (this.state.currentPage < Math.ceil(Pager.pagerHalfwayPoint)) {
      additionalNextLinkCount = Math.ceil(Pager.pagerHalfwayPoint) - this.state.currentPage;
    }

    // Make sure we don't exceed the lastPage
    return Math.min(
      this.state.currentPage + Math.floor(Pager.pagerHalfwayPoint) + additionalNextLinkCount,
      this.lastPage()
    );
  }

  lastPage() {
    return Math.ceil(this.props.resultCount / Pager.resultsPerPage, 10);
  }

  pageLinks() {
    const links = [];
    for (let pageNumber = this.pagerStart(); pageNumber <= this.pagerEnd(); pageNumber++) {
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
    const previousAndFirstPageButtons = (
      <div className="inline-block">
        <a
          href="#"
          className="next lastLink pagination-button"
          onClick={(e) => this.pageLinkClick(e, Pager.firstPage)}
          title="First Page">{/* TODO: Localization */}
          <span className="icon">First</span>
          <span className="accessible">page</span>
        </a>
        <a
          href="#"
          className="end nextLink pagination-button"
          onClick={(e) => this.pageLinkClick(e, this.state.currentPage - 1)}
          title="Previous Page">
          <span className="icon">Previous</span>
          <span className="accessible">page</span>
        </a>
      </div>
    );

    const nextAndLastPageButtons = (
      <div className="inline-block">
        <a
          href="#"
          className="next nextLink pagination-button"
          onClick={(e) => this.pageLinkClick(e, this.state.currentPage + 1)}
          title="Next Page">{/* TODO: Localization */}
          <span className="icon">Next</span>
          <span className="accessible">page</span>
        </a>
        <a
          href="#"
          className="end lastLink pagination-button"
          onClick={(e) => this.pageLinkClick(e, this.lastPage())}
          title="Last Page">
          <span className="icon">Last</span>
          <span className="accessible">page</span>
        </a>
      </div>
    );

    const ellipses = (
      <span className="ellipses">...</span>
    );

    return (
      <div className="results-pagination-controls">
        <div className="pagination">
          {/* TODO: move the logic to helpers and make tests for them */}
          {this.state.currentPage !== Pager.firstPage && previousAndFirstPageButtons}
          {this.pagerStart() !== Pager.firstPage && ellipses}

          {this.pageLinks()}

          {this.pagerEnd() !== this.lastPage() && ellipses}
          {this.state.currentPage !== this.lastPage() && nextAndLastPageButtons}
        </div>
      </div>
    );
  }
}

Pager.propTypes = {
  onPageChange: PropTypes.func.isRequired,
  resultCount: PropTypes.number.isRequired
};

Pager.defaultProps = {
  onPageChange: _.noop,
  resultCount: 0
};

export default Pager;
