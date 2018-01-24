import _ from 'lodash';
import { assert } from 'chai';

import Pagination from 'adminActivityFeed/components/Pagination';

describe('Pagination', () => {
  const validateButtons = (output, shouldNextDisabled, shouldPreviousDisabled) => {
    const nextPage = output.querySelector('.btn-page-changer-next');
    const previousPage = output.querySelector('.btn-page-changer-previous');

    assert(shouldNextDisabled === nextPage.hasAttribute('disabled'), 'next button shouldn\'t be disabled');
    assert(shouldPreviousDisabled === previousPage.hasAttribute('disabled'), 'previous button should be disabled');
  };

  const renderPagination = (props) => renderPureComponent(
    <Pagination
      currentPage={1}
      onGotoPage={_.noop}
      hasNextPage={true}
      hasPreviousPage={false}
      nextButtonText="Next"
      previousButtonText="Previous"
      {...props}
    />
  );

  describe('without other page numbers visible', () => {
    it('should render only the current page number if showCurrentPageNumber property value is true', () => {
      const output = renderPagination();
      const pageNumbers = [].slice.call(output.querySelectorAll('.page-number'));

      assert(pageNumbers.length === 1);
      assert(pageNumbers[0].textContent === '1');
      assert(pageNumbers[0].classList.contains('current'), 'current page number should have `current` class');
      assert(pageNumbers[0].hasAttribute('disabled'));
    });

    describe('and only next page available', () => {
      it('should render previous page button disabled and next page button clickable', () => {
        const output = renderPagination({hasNextPage: true, hasPreviousPage: false});
        validateButtons(output, false, true);
      });
    });

    describe('and only previous page available', () => {
      it('should render previous page button clickable and next page button disabled', () => {
        const output = renderPagination({hasNextPage: false, hasPreviousPage: true});
        validateButtons(output, true, false)
      });
    });

    describe('and both previous/next pages are availabe', () => {
      it('should render previous page and next page buttons as clickable', () => {
        const output = renderPagination({hasNextPage: true, hasPreviousPage: true});
        validateButtons(output, false, false);
      });
    });
  });

  describe('with other page numbers visible', () => {
    describe('and current page number is 1', () => {
      it('should render page numbers starting from 1 to 5', () => {
        const output = renderPagination({otherPageNumbersRange: 5, totalPages: 5, showOtherPageNumbers: true});
        const pageNumbers = [].slice.call(output.querySelectorAll('.page-number'));

        assert(pageNumbers.length === 5);
        pageNumbers.forEach((pageNum, i) => {
          assert(pageNum.textContent === (i + 1).toString(), `${i + 1}th page number should have text ${i + 1}`);
        });
        assert(pageNumbers[0].hasAttribute('disabled'), 'Current page number should be disabled');
      });

      it('should render until total page number if range exceeds total page number', () => {
        const output = renderPagination({otherPageNumbersRange: 5, totalPages: 3, showOtherPageNumbers: true});
        const pageNumbers = [].slice.call(output.querySelectorAll('.page-number'));

        assert(pageNumbers.length === 3);
        assert(pageNumbers[0].textContent === '1');
        assert(pageNumbers[pageNumbers.length - 1].textContent === '3');
        assert(pageNumbers[0].hasAttribute('disabled'), 'Current page number should be disabled');
      });
    });

    describe('and current page number is in the middle of total pages', () => {
      it('should try to show equal amount of page numbers for previous and next page numbers', () => {
        const output = renderPagination({otherPageNumbersRange: 5, totalPages: 10, currentPage: 3, showOtherPageNumbers: true});
        const pageNumbers = output.querySelectorAll('.page-number');


        assert(pageNumbers.length === 5);
        assert(pageNumbers[0].textContent === '1');
        assert(pageNumbers[pageNumbers.length - 1].textContent === '5');
        assert(pageNumbers[2].hasAttribute('disabled'), 'Current page number should be disabled');
      });
    });

    describe('and current page number is in the end of total pages', () => {
      it('should show only previous pages and current page number', () => {
        const output = renderPagination({otherPageNumbersRange: 5, totalPages: 10, currentPage: 10, showOtherPageNumbers: true});
        const pageNumbers = output.querySelectorAll('.page-number');

        assert(pageNumbers.length === 5);
        assert(pageNumbers[0].textContent === '6');
        assert(pageNumbers[4].textContent === '10');
        assert(pageNumbers[4].hasAttribute('disabled'), 'Current page number should be disabled');
      });
    });
  });
});
