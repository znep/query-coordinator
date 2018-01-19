import { assert } from 'chai';

import testStore from '../testStore';
import ActivityFeedPagination from 'adminActivityFeed/components/ActivityFeedPagination';

describe('ActivityFeedPagination', () => {
  const initialState = {
    pagination: {
      currentPage: 1,
      hasNextPage: true,
      hasPreviousPage: false
    }
  };

  let store = null;
  const renderPagination = () => {
    store = testStore({}, initialState);
    return renderComponentWithLocalization(ActivityFeedPagination, {}, store);
  };

  it('should render localized pagination button', () => {
    const output = renderPagination();
    const previousButton = output.querySelectorAll('.btn-page-changer-previous span')[1];
    const nextButton = output.querySelectorAll('.btn-page-changer-next span')[0];

    assert(previousButton.textContent === 'Previous');
    assert(nextButton.textContent === 'Next');
  });

  it('should only render current page', () => {
    const output = renderPagination();
    const pageNumbers = output.querySelectorAll('.page-number');

    assert(pageNumbers.length === 1);
    assert(pageNumbers[0].textContent === '1');
  });
});

