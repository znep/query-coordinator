import _ from 'lodash';
import React from 'react';
import classNames from 'classnames';

import { SocrataIcon } from 'socrata-components';
import './Pagination.scss';

export default class Pagination extends React.Component {
  renderPageNumber(number, isCurrent) {
    const classes = classNames(
      'btn',
      'page-number',
      {
        current: isCurrent
      }
    );

    return (
      <button
        key={`page-${number}`}
        className={classes}
        onClick={() => this.props.onGotoPage(number)}
        disabled={isCurrent}>
        {number.toString()}
      </button>
    );
  }

  render() {
    const {
      disabled,
      currentPage,
      hasNextPage,
      hasPreviousPage,
      totalPages,
      showOtherPageNumbers,
      showCurrentPageNumber,
      otherPageNumbersRange,
      onGotoPage,
      nextButtonText,
      previousButtonText
    } = this.props;

    const nextButton = (
      <button
        className="btn btn-transparent btn-page-changer btn-page-changer-next"
        disabled={!hasNextPage || disabled}
        onClick={() => onGotoPage(currentPage + 1)}>
        <span>{nextButtonText}</span>
        <SocrataIcon name="arrow-right" />
      </button>
    );

    const previousButton = (
      <button
        className="btn btn-transparent btn-page-changer btn-page-changer-previous"
        disabled={!hasPreviousPage || disabled}
        onClick={() => onGotoPage(currentPage - 1)}>
        <SocrataIcon name="arrow-left" />
        <span>{previousButtonText}</span>
      </button>
    );

    let pageNumbers = [];
    if (showOtherPageNumbers && !_.isNil(totalPages)) {
      const halfRange = Math.floor(otherPageNumbersRange / 2);
      const remainingEnd = Math.max(halfRange - (totalPages - currentPage), 0);
      const start = Math.max(currentPage - halfRange - remainingEnd, 1);
      const end = Math.min(start + (otherPageNumbersRange - 1), totalPages);

      pageNumbers = _.range(start, end + 1).map(i => {
        return this.renderPageNumber(i, i === currentPage);
      });
    } else if (showCurrentPageNumber) {
      pageNumbers.push(this.renderPageNumber(currentPage, true));
    }

    return (
      <div className="pagination">
        {previousButton}
        {pageNumbers}
        {nextButton}
      </div>
    );
  }
}

Pagination.defaultProps = {
  showOtherPageNumbers: false,
  showCurrentPageNumber: true,
  otherPageNumbersRange: 5,
  disabled: false
};

Pagination.propTypes = {
  currentPage: React.PropTypes.number.isRequired,
  hasNextPage: React.PropTypes.bool.isRequired,
  hasPreviousPage: React.PropTypes.bool.isRequired,
  totalPages: React.PropTypes.number,
  showOtherPageNumbers: React.PropTypes.bool.isRequired,
  showCurrentPageNumber: React.PropTypes.bool.isRequired,
  otherPageNumbersRange: React.PropTypes.number.isRequired,
  onGotoPage: React.PropTypes.func.isRequired,
  nextButtonText: React.PropTypes.string.isRequired,
  previousButtonText: React.PropTypes.string.isRequired,
  disabled: React.PropTypes.bool
};
