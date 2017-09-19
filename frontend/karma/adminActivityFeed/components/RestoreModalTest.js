import React from 'react';
import { assert } from 'chai';
import { Simulate } from 'react-dom/test-utils';

const MockHttpClient = require('../MockHttpClient').default;
const ActivityFeedApi = require('frontendApi/ActivityFeedApi').default;

import testStore from '../testStore';
import mockActivities from '../mockActivities';
import RestoreModal from 'components/RestoreModal';
import mockTranslations from '../mockTranslations';

import {
  DISMISS_RESTORE_MODAL
} from 'actionTypes';

describe('RestoreModal', () => {

  const httpClient = new MockHttpClient();
  const api = new ActivityFeedApi(httpClient);

  const store = testStore(api, {
    activities: mockActivities.activities,
    pagination: {
      currentPage: 1,
      hasNextPage: true,
      hasPreviousPage: false
    },
    restoreModal: {
      id: 'xxxx-xxxx',
      name: 'test_name'
    }
  });

  it('should render restore modal with correct title', () => {
    const output = renderComponentWithLocalization(RestoreModal, {}, store);
    const title = output.querySelector('.modal-header-title').textContent;
    const expectedTitle = mockTranslations.restore;

    assert.equal(title, expectedTitle);
  });

  it('should render restore modal with correct content', () => {
    const output = renderComponentWithLocalization(RestoreModal, {}, store);

    const content = output.querySelector('.modal-content').textContent;
    const expectedContent = mockTranslations.restore_confirmation.replace('%{dataset}', 'test_name');

    assert.equal(content, expectedContent);
  });

  it('should render restore modal with correct buttons', () => {
    const output = renderComponentWithLocalization(RestoreModal, {}, store);

    const cancelButton = output.querySelector('.btn-default').textContent;
    const restoreButton = output.querySelector('.btn-primary').textContent;

    const expectedCancelButton = mockTranslations.cancel;
    const expectedRestoreButton = mockTranslations.restore;

    assert.equal(cancelButton, expectedCancelButton);
    assert.equal(restoreButton, expectedRestoreButton);
  });

  it('cancel button should fire close event', (done) => {
    const output = renderComponentWithLocalization(RestoreModal, {}, store);
    assert.isNotNull(store.getState().toJS().restoreModal);

    Simulate.click(output.querySelector('.btn-default'));

    setTimeout(() => {
      assert.isNull(store.getState().toJS().restoreModal);

      done();
    }, 50);
  });

  it('restore button should fire restore event', (done) => {
    httpClient.respondWith('PATCH', /\/views\/xxxx-xxxx\.json\?method=restore/, 200, {});
    const output = renderComponentWithLocalization(RestoreModal, {}, store);

    Simulate.click(output.querySelector('.btn-primary'));

    setTimeout(() => {
      assert.isNull(store.getState().toJS().restoreModal);

      done();
    }, 50);
  });
});
