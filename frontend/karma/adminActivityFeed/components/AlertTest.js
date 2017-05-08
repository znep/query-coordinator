import React from 'react';
import { expect, assert } from 'chai';
import { Simulate } from 'react-addons-test-utils';

const MockHttpClient = require('../MockHttpClient').default;
const ActivityFeedApi = require('frontendApi/ActivityFeedApi').default;

import testStore from '../testStore';
import mockActivities from '../mockActivities';
import Alert from 'components/Alert';
import mockTranslations from '../mockTranslations';

import {
  DISMISS_RESTORE_MODAL
} from 'actionTypes';

describe('Alert', () => {
  const httpClient = new MockHttpClient();
  const api = new ActivityFeedApi(httpClient);

  const store = testStore(api, {
    activities: mockActivities.activities,
    pagination: {
      currentPage: 1,
      hasNextPage: true,
      hasPreviousPage: false
    },
    alert: {
      type: 'success',
      translationKey: 'restore_success'
    }
  });

  it('should render alert correctly with given settings', () => {
    const output = renderComponentWithLocalization(Alert, {}, store);
    const actual = output.querySelector('span').textContent;
    const expected = mockTranslations.index_page.alerts.restore_success;

    expect(actual).to.eq(expected);
  });

  it('should dismissed when clicked X', (done) => {
    const output = renderComponentWithLocalization(Alert, {}, store);

    Simulate.click(output.querySelector('.socrata-icon-close'));

    setTimeout(() => {
      expect(store.getState().toJS().alert).to.be.null;
      done();
    }, 50);
  });
});
