import _ from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

import { SocrataIcon } from 'common/components';
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

    const nextButtonDisabled = !hasNextPage || disabled;
    const nextButtonClass = classNames(
      'btn btn-transparent btn-page-changer btn-page-changer-next',
      {disabled: nextButtonDisabled}
    );
    const nextButtonTextEl = _.isObject(nextButtonText) ?
      nextButtonText : <span>{nextButtonText}</span>;
    const nextButton = (
      <button
        className={nextButtonClass}
        disabled={nextButtonDisabled}
        onClick={() => onGotoPage(currentPage + 1)}>
        {nextButtonTextEl}
        <SocrataIcon name="arrow-right" />
      </button>
    );

    const prevButtonDisabled = !hasPreviousPage || disabled;
    const prevButtonClass = classNames(
      'btn btn-transparent btn-page-changer btn-page-changer-previous',
      {disabled: prevButtonDisabled}
    );
    const previousButtonTextEl = _.isObject(previousButtonText) ?
      previousButtonText : <span>{previousButtonText}</span>;

    const prevButton = (
      <button
        className={prevButtonClass}
        disabled={prevButtonDisabled}
        onClick={() => onGotoPage(currentPage - 1)}>
        <SocrataIcon name='arrow-left' />
        {previousButtonTextEl}
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
      <div className='pagination'>
        {prevButton}
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
  currentPage: PropTypes.number.isRequired,
  hasNextPage: PropTypes.bool.isRequired,
  hasPreviousPage: PropTypes.bool.isRequired,
  totalPages: PropTypes.number,
  showOtherPageNumbers: PropTypes.bool.isRequired,
  showCurrentPageNumber: PropTypes.bool.isRequired,
  otherPageNumbersRange: PropTypes.number.isRequired,
  onGotoPage: PropTypes.func.isRequired,
  nextButtonText: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]).isRequired,
  previousButtonText: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.object
  ]).isRequired,
  disabled: PropTypes.bool
};
