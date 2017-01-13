import React, { Component, PropTypes } from 'react';
import _ from 'lodash';

export class Pager extends Component {
  constructor(props) {
    super(props);
    this.state = {
      currentPage: 1,
      pageIsInvalid: false,
      currentPageInputKey: 1
      /*
        currentPageInputKey only exists so that the defaultValue of the input field updates when the prev/next
        links are clicked. Otherwise, the input would not update due to how React treats defaultValue.
        We cannot just use "value" instead, because then the input would not be modifiable (controllable).
      */
    };
    _.bindAll(this, [
      'lastPage',
      'prevLinkClick',
      'nextLinkClick',
      'lastLinkClick',
      'pageInputChange',
      'pageInputKeyPress',
      'changePage'
    ]);
  }

  lastPage() {
    return Math.ceil(this.props.resultCount / this.props.resultsPerPage, 10);
  }

  prevLinkClick(e) {
    e.preventDefault();
    if (this.state.currentPage > 1) {
      this.changePage(this.state.currentPage - 1);
    }
  }

  nextLinkClick(e) {
    e.preventDefault();
    if (this.state.currentPage < this.lastPage()) {
      this.changePage(this.state.currentPage + 1);
    }
  }

  lastLinkClick(e) {
    e.preventDefault();
    this.changePage(this.lastPage());
  }

  pageInputChange(e) {
    const newPage = e.target.value;
    if (parseInt(newPage, 10) === this.state.currentPage) return;
    if (newPage && newPage >= 1 && newPage <= this.lastPage()) {
      this.changePage(newPage);
      this.setState({ pageIsInvalid: false });
    } else {
      // Invalid page
      this.setState({ pageIsInvalid: true });
    }
  }

  pageInputKeyPress(e) {
    if (e.key === 'Enter') {
      $(e.target).trigger('blur');
    }
  }

  changePage(pageNumber) {
    this.props.onPageChange(pageNumber);
    this.setState({
      currentPage: parseInt(pageNumber, 10),
      currentPageInputKey: this.state.currentPageInputKey + 1
      /* increment the key to trigger a re-render of the currentPageInput */
    });
  }

  render() {
    const prevLinkDisabled = this.state.currentPage === 1;
    const prevLinkClasses = [
      'prev-link',
      'inline-block',
      prevLinkDisabled ? 'disabled' : null
    ].filter((className) => className).join(' ');

    const prevLink = (
      <a
        href="#"
        className={prevLinkClasses}
        onClick={(e) => this.prevLinkClick(e)}
        title="Previous page">{/* TODO: localization */}
        <span className="socrata-icon-arrow-left"></span>
        <span className="accessible">Previous page</span>{/* TODO: localization */}
      </a>
    );

    const nextLinkDisabled = this.state.currentPage === this.lastPage();
    const nextLinkClasses = [
      'next-link',
      'inline-block',
      nextLinkDisabled ? 'disabled' : null
    ].filter((className) => className).join(' ');

    const nextLink = (
      <a
        href="#"
        className={nextLinkClasses}
        onClick={(e) => this.nextLinkClick(e)}
        title="Next page">{/* TODO: localization */}
        <span className="socrata-icon-arrow-right"></span>
        <span className="accessible">Next page</span>{/* TODO: localization */}
      </a>
    );

    const currentPageInputClasses = [
      'current-page-input',
      'inline-block',
      this.state.pageIsInvalid ? 'error' : null
    ].filter((className) => className).join(' ');

    const currentPageInput = (
      <div className={currentPageInputClasses}>
        <input
          key={this.state.currentPageInputKey}
          type="text"
          defaultValue={this.state.currentPage}
          onBlur={this.pageInputChange}
          onKeyPress={this.pageInputKeyPress} />
        <span className="accessible">Page {this.state.currentPage}</span>{/* TODO: localization */}
      </div>
    );

    const lastPageLink = (
      <a
        href="#"
        className="last-page-link"
        onClick={(e) => this.lastLinkClick(e)}
        title="Last page">{/* TODO: localization */}
        {this.lastPage()}
        <span className="accessible">Last page</span>{/* TODO: localization */}
      </a>
    );

    return (
      <div className="pager">
        {prevLink}
        {currentPageInput} of {lastPageLink}{/* TODO: localization */}
        {nextLink}
      </div>
    );
  }
}

Pager.propTypes = {
  onPageChange: PropTypes.func.isRequired,
  resultCount: PropTypes.number.isRequired,
  resultsPerPage: PropTypes.number.isRequired
};

Pager.defaultProps = {
  onPageChange: _.noop,
  resultCount: 0,
  resultsPerPage: 6
};

export default Pager;
