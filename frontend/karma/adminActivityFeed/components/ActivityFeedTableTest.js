import _ from 'lodash';
import { expect, assert } from 'chai';

import testStore from '../testStore';
import mockActivities from '../mockActivities';
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

    expect(columnTitles.length).to.eq(7);
    expect(columnTitles).to.deep.eq(expectedColumnTitles);
  });

  it('should render localized dates', () => {
    const output = renderComponentWithLocalization(ActivityFeedTable, {}, store);
    const dateColumns = [].slice.call(output.querySelectorAll('tr td[data-column=dateStarted]')).map(c => c.textContent);

    const expectedDateColumns = [
      'March 14, 2017',
      'March 7, 2017',
      'March 7, 2017'
    ];

    expect(expectedDateColumns).to.deep.eq(dateColumns);
  });
});
