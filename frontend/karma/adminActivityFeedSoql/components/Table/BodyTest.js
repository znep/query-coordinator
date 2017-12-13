import { assert } from 'chai';
import moment from 'moment';

import Table from 'components/Table';
import * as mockData from '../../data/mockFetchTable';

import testStore from '../../testStore';

describe('Table/Body renders cell', () => {
  const store = testStore({
    table: {
      data: mockData.data1
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
    assert.equal(thisCell.getAttribute('href'), `/profile/${mockData.data1[0].acting_user_id}`);
    assert.equal(thisCell.textContent, mockData.data1[0].acting_user_name);
  });

  it('event', () => {
    const thisCell = element.querySelector('tbody tr:nth-of-type(1) td.event');

    assert.equal(thisCell.textContent, mockData.data1[0].activity_type);
  });

  it('item-affected', () => {
    const thisCell = element.querySelector('tbody tr:nth-of-type(1) td.item-affected');

    assert.equal(thisCell.textContent, mockData.data1[0].affected_item);
  });

  it('date', () => {
    const thisCell = element.querySelector('tbody tr:nth-of-type(1) td.date');
    const formattedDate = moment(
      mockData.data1[0].created_at,
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
