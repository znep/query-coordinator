import React, { Component, PropTypes } from 'react';
import $ from 'jquery';
import _ from 'lodash';
import { handleKeyPress } from '../../helpers/keyPressHelpers';

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

    const prevPageText = _.get(I18n, 'asset_selector.results_container.pager.previous_page', 'Previous page');

    const prevLink = (
      <a
        href="#"
        className={prevLinkClasses}
        onClick={(e) => this.prevLinkClick(e)}
        onKeyDown={handleKeyPress((e) => this.prevLinkClick(e))}
        role="button"
        aria-label={prevPageText}
        title={prevPageText}>
        <span className="socrata-icon-arrow-left"></span>
        <span className="accessible">
          {prevPageText}
        </span>
      </a>
    );

    const nextLinkDisabled = this.props.currentPage === this.lastPage();
    const nextLinkClasses = [
      'next-link',
      'inline-block',
      nextLinkDisabled ? 'disabled' : null
    ].filter((className) => className).join(' ');

    const nextPageText = _.get(I18n, 'asset_selector.results_container.pager.next_page', 'Next page');

    const nextLink = (
      <a
        href="#"
        className={nextLinkClasses}
        onClick={(e) => this.nextLinkClick(e)}
        onKeyDown={handleKeyPress((e) => this.nextLinkClick(e))}
        role="button"
        aria-label={nextPageText}
        title={nextPageText}>
        <span className="socrata-icon-arrow-right"></span>
        <span className="accessible">{nextPageText}</span>
      </a>
    );

    const currentPageInputClasses = [
      'current-page-input',
      'inline-block',
      this.state.pageIsInvalid ? 'error' : null
    ].filter((className) => className).join(' ');

    const pageNumberText =
      `${_.get(I18n, 'asset_selector.results_container.pager.page', 'Page')} ${this.props.currentPage}`;

    const currentPageInput = (
      <div className={currentPageInputClasses}>
        <input
          type="text"
          aria-label={pageNumberText}
          defaultValue={this.props.currentPage}
          onBlur={this.pageInputChange}
          onKeyPress={this.pageInputKeyPress} />
        <span className="accessible">{pageNumberText}</span>
      </div>
    );

    const lastPageText = _.get(I18n, 'asset_selector.results_container.pager.last_page', 'Last page');

    const lastPageLink = (
      <a
        href="#"
        className="last-page-link"
        onClick={(e) => this.lastLinkClick(e)}
        onKeyDown={handleKeyPress((e) => this.lastLinkClick(e))}
        role="button"
        aria-label={lastPageText}
        title={lastPageText}>
        {this.lastPage()}
        <span className="accessible">{lastPageText}</span>
      </a>
    );

    return (
      <div className="pager">
        {prevLink}
        {currentPageInput}
        {` ${_.get(I18n, 'asset_selector.results_container.of', 'of')} `}
        {lastPageLink}
        {nextLink}
      </div>
    );
  }
}

Pager.propTypes = {
  changePage: PropTypes.func.isRequired,
  currentPage: PropTypes.number.isRequired,
  resultCount: PropTypes.number.isRequired,
  resultsPerPage: PropTypes.number.isRequired
};

Pager.defaultProps = {
  changePage: _.noop,
  currentPage: 1,
  resultCount: 0,
  resultsPerPage: 6
};

export default Pager;
