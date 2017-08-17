import _ from 'lodash';
import moment from 'moment-timezone';
import { assert } from 'chai';

import testStore from '../testStore';
import mockActivities from '../mockActivities';
import mockTranslations from '../mockTranslations';
import ActivityFeedTable from 'components/ActivityFeedTable';

describe('ActivityFeedTable', () => {
  // Update mock data dates as they'll be compared against current date.
  _.set(mockActivities, 'activities[3].data.latest_event.event_time', moment().format());
  _.set(mockActivities, 'activities[4].data.latest_event.event_time', moment().subtract(15, 'days').format());

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
      'Date Started',
      'Event',
      'Asset Name',
      'Initiated By',
      'Status',
      ''
    ];

    assert.lengthOf(columnTitles, 6);
    assert.deepEqual(columnTitles, expectedColumnTitles);
  });

  it('should indicate sorted table column', () => {
    const output = renderComponentWithLocalization(ActivityFeedTable, {}, store);
    const columns = [].slice.call(output.querySelectorAll('thead th'));
    const dateColumn = columns[4];

    columns.forEach((column) => {
      const indicator = column.querySelector('span.sorting-indicator');

      if (column === dateColumn) {
        assert.isDefined(indicator);
      } else {
        assert.isNull(indicator);
      }
    });
  });

  it('should render localized dates', () => {
    const output = renderComponentWithLocalization(ActivityFeedTable, {}, store);
    const dateColumns = [].slice.call(output.querySelectorAll('tr td[data-column=dateStarted]')).map(c => c.textContent);

    const expectedDateColumns = [
      'March 14, 2017',
      'March 7, 2017',
      'March 7, 2017',
      'August 3, 2017',
      'April 24, 2017'
    ];

    assert.deepEqual(expectedDateColumns, dateColumns);
  });

  it('should render view details link for failed activities', () => {
    const output = renderComponentWithLocalization(ActivityFeedTable, {}, store);
    const rows = [].slice.call(output.querySelectorAll('tbody tr'));

    const statusesForDetails = [mockTranslations.statuses.success_with_data_errors, mockTranslations.statuses.failure];
    const getRowStatus = (row) => row.querySelector('td[data-column=status]').textContent;
    const getRowAction = (row) => row.querySelector('td[data-column=actions]').textContent;

    rows.
      filter(row => statusesForDetails.includes(getRowStatus(row))).
      forEach(row => assert(getRowAction(row) === 'View Details'));
  });

  describe('should render deleted datasets names correctly', () => {
    it('should render asset name as link if activity type is not delete', () => {
      const output = renderComponentWithLocalization(ActivityFeedTable, {}, store);
      const rows = [].slice.call(output.querySelectorAll('tbody tr'));

      assert.equal(
        rows[0].querySelector('td[data-column=name]').textContent,
        mockActivities.activities[0].dataset.name
      );

      assert.equal(
        rows[0].querySelector('td[data-column=name] a').tagName,
        'A'
      );
    });

    it('when dataset completely deleted', () => {
      const output = renderComponentWithLocalization(ActivityFeedTable, {}, store);
      const rows = [].slice.call(output.querySelectorAll('tbody tr'));

      assert.equal(
        rows[1].querySelector('td[data-column=name]').textContent,
        `${mockActivities.activities[1].dataset.name} ${mockTranslations.index_page.deleted}`
      );
    });

    it('when dataset marked deleted', () => {
      const output = renderComponentWithLocalization(ActivityFeedTable, {}, store);
      const rows = [].slice.call(output.querySelectorAll('tbody tr'));

      assert.equal(
        rows[2].querySelector('td[data-column=name]').textContent,
        `${mockTranslations.index_page.deleted_dataset}`
      );
    });
  });

  describe('restored datasets', () => {
    it('should have text "Restored"', () => {
      const output = renderComponentWithLocalization(ActivityFeedTable, {}, store);
      const rows = [].slice.call(output.querySelectorAll('tbody tr'));

      assert.equal(
        rows[3].querySelector('td[data-column=actions]').textContent,
        `${mockTranslations.restored}`
      );
    });

    it('should not have text "Restored" if 14 days past', () => {
      const output = renderComponentWithLocalization(ActivityFeedTable, {}, store);
      const rows = [].slice.call(output.querySelectorAll('tbody tr'));

      assert.notEqual(
        rows[4].querySelector('td[data-column=actions]').textContent,
        `${mockTranslations.restored}`
      );
    });
  });

});
