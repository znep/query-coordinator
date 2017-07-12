import {fromJS} from 'immutable';
import moment from 'moment';
import React from 'react';
import { assert } from 'chai';
import { Simulate } from 'react-addons-test-utils';

const MockHttpClient = require('../MockHttpClient').default;
const ActivityFeedApi = require('frontendApi/ActivityFeedApi').default;

import testStore from '../testStore';
import mockActivities from '../mockActivities';
import DetailsModal from 'components/DetailsModal';
import mockTranslations from '../mockTranslations';

describe('DetailsModal', () => {

  const mockActivity = {
    data: {
      activity_type: 'data.activity_type',
      status: 'failure',
      latest_event: {
        event_type: 'archive_error',
        info: {
          reason: 'because..',
          badRowsPath: 'a_link'
        },
        status: 'failure'
      },
      created_at: '2000-01-01',
      service: 'DeltaImporter2',
      activity_name: 'file_name'
    },
    dataset: {
      name: 'dataset.name'
    },
    initiated_by: {
      displayName: 'initiated_by.displayName'
    }
  };

  const httpClient = new MockHttpClient();
  const api = new ActivityFeedApi(httpClient);

  const store = testStore(api, {
    activities: mockActivities.activities,
    pagination: {
      currentPage: 1,
      hasNextPage: true,
      hasPreviousPage: false
    },
    detailsModal: fromJS(mockActivity)
  });

  it('should render restore modal with correct title', () => {
    const output = renderComponentWithLocalization(DetailsModal, {}, store);
    const title = output.querySelector('.modal-header-title').textContent;
    const expectedTitle = mockTranslations.details;

    assert.equal(title, expectedTitle);
  });

  it('should render restore modal with correct content', () => {
    const output = renderComponentWithLocalization(DetailsModal, {}, store);
    const lineActivityType = output.querySelector('#line-activity-type').textContent;
    const lineActivityName = output.querySelector('#line-activity-name').textContent;
    const lineActivityEventTitle = output.querySelector('#line-activity-event-title').textContent;
    const lineActivityEventDesc = output.querySelector('#line-activity-event-desc').textContent;
    const lineActivityInitiatedAt = output.querySelector('#line-activity-initiated-at').textContent;
    const lineActivityStartedBy = output.querySelector('#line-activity-started-by').textContent;
    const lineActivityImportMethod = output.querySelector('#line-activity-import-method').textContent;
    const lineActivityBadRowsDownloadLink = output.querySelector('#line-activity-bad-rows a').getAttribute('href');

    const expectedEventTitle = mockTranslations.show_page.
      event_messages[mockActivity.data.status][mockActivity.data.latest_event.event_type].title;
    const expectedEventDesc = mockTranslations.show_page.
      event_messages[mockActivity.data.status][mockActivity.data.latest_event.event_type].
      description.replace('%{reason}', mockActivity.data.latest_event.info.reason);
    const expectedInitiatedAt = `${mockTranslations.initiated_at}: ${moment(mockActivity.data.created_at).format('LLL')}`;
    const expectedStartedBy = `${mockTranslations.started_by}: ${mockActivity.initiated_by.displayName}`;
    const expectedImportMethod = `${mockTranslations.import_method}: ${mockTranslations.show_page.services[mockActivity.data.service]}`;
    const expectedName = `${mockActivity.dataset.name} (${mockActivity.data.activity_name})`;

    assert.equal(lineActivityType, mockActivity.data.activity_type);
    assert.equal(lineActivityName, expectedName);
    assert.equal(lineActivityEventTitle, expectedEventTitle);
    assert.equal(lineActivityEventDesc, expectedEventDesc);
    assert.equal(lineActivityInitiatedAt, expectedInitiatedAt);
    assert.equal(lineActivityStartedBy, expectedStartedBy);
    assert.equal(lineActivityImportMethod, expectedImportMethod);
    assert.equal(lineActivityBadRowsDownloadLink, mockActivity.data.latest_event.info.badRowsPath);
  });

  it('close button should fire close event', (done) => {
    const output = renderComponentWithLocalization(DetailsModal, {}, store);

    assert.isNotNull(store.getState().toJS().detailsModal);

    Simulate.click(output.querySelector('.btn-default'));

    setTimeout(() => {
      assert.isNull(store.getState().toJS().detailsModal);

      done();
    }, 50);
  });

});
