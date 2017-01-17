import React, { Component, PropTypes } from 'react';
import $ from 'jquery';
import _ from 'lodash';
import { handleKeyPress } from '../lib/a11yHelpers';

export class Pager extends Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'lastPage',
      'prevLinkClick',
      'nextLinkClick',
      'lastLinkClick',
      'pageInputChange',
      'pageInputKeyPress'
    ]);

    this.state = {
      pageIsInvalid: false
    };
  }

  lastPage() {
    return Math.ceil(this.props.resultCount / this.props.resultsPerPage, 10);
  }

  prevLinkClick(e) {
    e.preventDefault();
    if (this.props.currentPage > 1) {
      this.props.changePage(this.props.currentPage - 1);
    }
  }

  nextLinkClick(e) {
    e.preventDefault();
    if (this.props.currentPage < this.lastPage()) {
      this.props.changePage(this.props.currentPage + 1);
    }
  }

  lastLinkClick(e) {
    e.preventDefault();
    this.props.changePage(this.lastPage());
  }

  pageInputChange(e) {
    const newPage = parseInt(e.target.value, 10);
    if (newPage === this.props.currentPage && !this.state.pageIsInvalid) return;
    if (newPage >= 1 && newPage <= this.lastPage()) {
      this.props.changePage(newPage);
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

  render() {
    const prevLinkDisabled = this.props.currentPage === 1;
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
        onKeyDown={handleKeyPress((e) => this.prevLinkClick(e))}
        role="button"
        aria-label="Previous page"
        title="Previous page">{/* TODO: localization */}
        <span className="socrata-icon-arrow-left"></span>
        <span className="accessible">Previous page</span>{/* TODO: localization */}
      </a>
    );

    const nextLinkDisabled = this.props.currentPage === this.lastPage();
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
        onKeyDown={handleKeyPress((e) => this.nextLinkClick(e))}
        role="button"
        aria-label="Next page"
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
          type="text"
          aria-label={`Current page: ${this.props.currentPage}`}
          defaultValue={this.props.currentPage}
          onBlur={this.pageInputChange}
          onKeyPress={this.pageInputKeyPress} />
        <span className="accessible">Page {this.props.currentPage}</span>{/* TODO: localization */}
      </div>
    );

    const lastPageLink = (
      <a
        href="#"
        className="last-page-link"
        onClick={(e) => this.lastLinkClick(e)}
        onKeyDown={handleKeyPress((e) => this.lastLinkClick(e))}
        role="button"
        aria-label="Last page"
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
  currentPage: PropTypes.number.isRequired,
  changePage: PropTypes.func.isRequired,
  resultCount: PropTypes.number.isRequired,
  resultsPerPage: PropTypes.number.isRequired
};

Pager.defaultProps = {
  currentPage: 1,
  changePage: _.noop,
  resultCount: 0,
  resultsPerPage: 6
};

export default Pager;
