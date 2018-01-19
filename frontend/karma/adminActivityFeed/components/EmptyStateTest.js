import React from 'react';
import { assert } from 'chai';

const MockHttpClient = require('../MockHttpClient').default;
const ActivityFeedApi = require('adminActivityFeed/frontendApi/ActivityFeedApi').default;

import testStore from '../testStore';
import EmptyState from 'adminActivityFeed/components/EmptyState';
import mockTranslations from '../mockTranslations';

describe('EmptyState', () => {
  const httpClient = new MockHttpClient();
  const api = new ActivityFeedApi(httpClient);

  it('should render empty state for empty table', () => {
    const store = testStore(api, {
      activities: [],
      loading: false,
      filter: {event: 'All', status: 'All', dateFrom: null, dateTo: null}
    });

    const output = renderComponentWithLocalization(EmptyState, {}, store);
    const actual = output.textContent;

    const tempElement = document.createElement('span');
    tempElement.innerHTML = mockTranslations.empty_message.replace('%{new_dataset_url}', '/datasets/new');
    const expected = tempElement.textContent;

    assert.equal(actual, expected);
  });

  it('should render empty state for empty result set after filters', () => {
    const store = testStore(api, {
      activities: [],
      loading: false,
      filter: {event: 'Import', status: 'Deleted', dateFrom: null, dateTo: null}
    });

    const output = renderComponentWithLocalization(EmptyState, {}, store);
    const actual = output.textContent;

    const tempElement = document.createElement('span');
    tempElement.innerHTML = mockTranslations.empty_message_filtered;
    const expected = tempElement.textContent;

    assert.equal(actual, expected);
  });
});
