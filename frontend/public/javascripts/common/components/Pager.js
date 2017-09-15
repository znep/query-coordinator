import PropTypes from 'prop-types';
import React from 'react';
import _ from 'lodash';
import classNames from 'classnames';
import { ENTER } from 'common/keycodes';
import { handleKeyPress } from '../helpers/keyPressHelpers';

export class Pager extends React.Component {
  constructor(props) {
    super(props);

    _.bindAll(this, [
      'lastPage',
      'prevLinkClick',
      'nextLinkClick',
      'lastLinkClick',
      'pageInputChange',
      'pageInputKeyDown',
      'renderPagerLink'
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
    e.stopPropagation();
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

  pageInputKeyDown(e) {
    e.stopPropagation();
    if (e.keyCode === ENTER) {
      e.preventDefault();
      e.target.blur();
    }
  }

  renderPagerLink(options) {
    const linkClasses = classNames('inline-block', options.className, {
      disabled: options.linkIsDisabled
    });

    return (
      <a
        href="#"
        className={linkClasses}
        onClick={options.onClick}
        onKeyDown={options.onKeyDown}
        role="button"
        aria-label={options.text}
        tabIndex={options.linkTabIndex}
        title={options.text}>
        <span className={options.iconClass}></span>
        <span className="accessible">
          {options.text}
        </span>
      </a>
    );
  }

  render() {
    if (!this.lastPage() || this.lastPage() <= 1) {
      return <div className="pager"></div>;
    }

    const prevLinkDisabled = this.props.currentPage === 1;
    const prevLink = this.renderPagerLink({
      className: 'prev-link',
      iconClass: 'socrata-icon-arrow-left',
      linkIsDisabled: prevLinkDisabled,
      linkTabIndex: prevLinkDisabled ? -1 : 0,
      onClick: (e) => this.prevLinkClick(e),
      onKeyDown: handleKeyPress((e) => this.prevLinkClick(e)),
      text: _.get(I18n, 'common.asset_selector.results_container.pager.previous_page')
    });

    const nextLinkDisabled = this.props.currentPage === this.lastPage();
    const nextLink = this.renderPagerLink({
      className: 'next-link',
      iconClass: 'socrata-icon-arrow-right',
      linkIsDisabled: nextLinkDisabled,
      linkTabIndex: nextLinkDisabled ? -1 : 0,
      onClick: (e) => this.nextLinkClick(e),
      onKeyDown: handleKeyPress((e) => this.nextLinkClick(e)),
      text: _.get(I18n, 'common.asset_selector.results_container.pager.next_page')
    });

    const currentPageInputClasses = classNames('current-page-input', 'inline-block', {
      error: this.state.pageIsInvalid
    });

    const errorAltText = this.state.pageIsInvalid &&
      _.get(I18n, 'common.asset_selector.results_container.pager.invalid_page_error').
        format({
          first: 1,
          last: this.lastPage()
        });

    const pageNumberText =
      `${_.get(I18n, 'common.asset_selector.results_container.pager.page')} ${this.props.currentPage}`;

    const currentPageInput = (
      <div className={currentPageInputClasses}>
        <input
          key={this.props.currentPage}
          type="text"
          alt={errorAltText}
          aria-label={pageNumberText}
          defaultValue={this.props.currentPage}
          onBlur={this.pageInputChange}
          onKeyDown={this.pageInputKeyDown} />
        <span className="accessible">{pageNumberText}</span>
      </div>
    );

    const lastPageText = _.get(I18n, 'common.asset_selector.results_container.pager.last_page');

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
        {` ${_.get(I18n, 'common.asset_selector.results_container.of')} `}
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
