import { assert } from 'chai';

import testStore from '../testStore';
import mockActivities from '../mockActivities';
import mockTranslations from '../mockTranslations';
import ActivityFeedTable from 'components/ActivityFeedTable';

describe('ActivityFeedTable', () => {
  const store = testStore({}, {
    activities: mockActivities.activities,
    pagination: {
      currentPage: 1,
      hasNextPage: true,
      hasPreviousPage: false
    }
  });

  it('should render localized header columns', () => {
    const output = renderComponentWithLocalization(ActivityFeedTable, {}, store);
    const columnTitles = [].slice.call(output.querySelectorAll('thead th')).map(c => c.textContent);

    const expectedColumnTitles = [
      'Asset Type',
      'Event',
      'Asset Name',
      'Initiated By',
      'Date Started',
      'Status',
      ''
    ];

    assert.lengthOf(columnTitles, 7);
    assert.deepEqual(columnTitles, expectedColumnTitles);
  });

  it('should render localized dates', () => {
    const output = renderComponentWithLocalization(ActivityFeedTable, {}, store);
    const dateColumns = [].slice.call(output.querySelectorAll('tr td[data-column=dateStarted]')).map(c => c.textContent);

    const expectedDateColumns = [
      'March 14, 2017',
      'March 7, 2017',
      'March 7, 2017'
    ];

    assert.deepEqual(expectedDateColumns, dateColumns);
  });

  it('should render view details link for failed activities', () => {
    const output = renderComponentWithLocalization(ActivityFeedTable, {}, store);

    Array.prototype.filter.
      call(
        output.querySelectorAll('tbody tr'),
        row => [mockTranslations.statuses.success_with_data_errors, mockTranslations.statuses.failure].
          includes(row.querySelector('td[data-column=status]').textContent)
      ).
      forEach(row => assert(row.querySelector('td[data-column=actions]').textContent === 'View Details'));
  });

});
