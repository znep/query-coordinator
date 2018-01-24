import { assert } from 'chai';
import moment from 'moment';

import Table from 'adminActivityFeedSoql/components/Table';
import mockTranslations from '../../mockTranslations';
import mockData from '../../data/mockFetchTable';

import testStore from '../../testStore';

describe('Table/Body renders cell', () => {
  const store = testStore({
    table: {
      data: mockData
    }
  });

  const element = renderComponentWithLocalization(Table, {}, store);

  it('type', () => {
    const thisCell = element.querySelector('tbody tr:nth-of-type(1) td.type span.socrata-icon');

    assert.isNotNull(thisCell);
  });

  it('initiated-by', () => {
    const thisCell = element.querySelector('tbody tr:nth-of-type(1) td.initiated-by a');

    assert.isNotNull(thisCell);
    assert.equal(thisCell.getAttribute('href'), `/profile/${mockData[0].acting_user_id}`);
    assert.equal(thisCell.textContent, mockData[0].acting_user_name);
  });

  it('event', () => {
    const thisCell = element.querySelector('tbody tr:nth-of-type(1) td.event');
    const translation = mockTranslations.filters.events.options[_.snakeCase(mockData[0].activity_type)];
    assert.equal(thisCell.textContent, translation);
  });

  it('item-affected', () => {
    const thisCell = element.querySelector('tbody tr:nth-of-type(1) td.item-affected');

    assert.equal(thisCell.textContent, mockData[0].affected_item);
  });

  it('date', () => {
    const thisCell = element.querySelector('tbody tr:nth-of-type(1) td.date');
    const formattedDate = moment(
      mockData[0].created_at,
      moment.ISO_8601).format('MMMM D, YYYY hh:mm:ss A'
    );

    assert.equal(thisCell.textContent, formattedDate);
  });

  it('actions', () => {
    const thisCell = element.querySelector('tbody tr:nth-of-type(1) td.actions');

    // This cell is empty for now.
    assert.isNotNull(thisCell);
  });

});
