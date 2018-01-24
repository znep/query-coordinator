import _ from 'lodash';
import {fromJS} from 'immutable';
import moment from 'moment';
import React from 'react';
import { assert } from 'chai';
import { Simulate } from 'react-dom/test-utils';
import I18nJS from 'i18n-js';

const MockHttpClient = require('../MockHttpClient').default;
const ActivityFeedApi = require('adminActivityFeed/frontendApi/ActivityFeedApi').default;

import testStore from '../testStore';
import mockActivities from '../mockActivities';
import DetailsModal from 'adminActivityFeed/components/DetailsModal';
import mockTranslations from '../mockTranslations';

describe('DetailsModal', () => {

  const mockActivity = {
    data: {
      activity_type: 'restore',
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

  const store =
    (override = {}) => testStore(
      api,
      _.merge(
        {
          activities: mockActivities.activities,
          pagination: {
            currentPage: 1,
            hasNextPage: true,
            hasPreviousPage: false
          },
          detailsModal: fromJS(mockActivity)
        },
        override
      )
    );

  it('should render details modal with correct title', () => {
    const output = renderComponentWithLocalization(DetailsModal, {}, store());
    const title = output.querySelector('.modal-header-title').textContent;
    const expectedTitle = mockTranslations.details;

    assert.equal(title, expectedTitle);
  });

  it('should render details modal with correct content', () => {
    const output = renderComponentWithLocalization(DetailsModal, {}, store());
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

    assert.equal(lineActivityType, I18nJS.t('screens.admin.jobs.actions.restore'));
    assert.equal(lineActivityName, expectedName);
    assert.equal(lineActivityEventTitle, expectedEventTitle);
    assert.equal(lineActivityEventDesc, expectedEventDesc);
    assert.equal(lineActivityInitiatedAt, expectedInitiatedAt);
    assert.equal(lineActivityStartedBy, expectedStartedBy);
    assert.equal(lineActivityImportMethod, expectedImportMethod);
    assert.equal(lineActivityBadRowsDownloadLink, mockActivity.data.latest_event.info.badRowsPath);
  });

  it('should render details without known event type and description', () => {
    const mockEventType = 'very_weird_unknown_error';
    const mockActivityWithUnknownEvent = _.merge(
      mockActivity,
      {
        data: {
          latest_event: {
            event_type: 'very_weird_unknown_error'
          }
        }
      }
    );

    const output = renderComponentWithLocalization(
      DetailsModal,
      {},
      store({detailsModal: fromJS(mockActivityWithUnknownEvent)})
    );

    const lineActivityEventTitle = output.querySelector('#line-activity-event-title').textContent;
    const lineActivityEventDesc = output.querySelector('#line-activity-event-desc').textContent;

    const expectedEventTitle = mockTranslations.show_page.fallback_event_title.
      replace('%{error_code}', mockEventType);

    assert.equal(lineActivityEventTitle, expectedEventTitle);
    assert.include(lineActivityEventDesc, mockActivity['data']['latest_event']['info']['reason']);
    assert.include(lineActivityEventDesc, mockActivity['data']['latest_event']['info']['badRowsPath']);
  });

  it('close button should fire close event', (done) => {
    const mockStore = store();
    const output = renderComponentWithLocalization(DetailsModal, {}, mockStore);

    assert.isNotNull(mockStore.getState().toJS().detailsModal);

    Simulate.click(output.querySelector('.btn-default'));

    setTimeout(() => {
      assert.isNull(mockStore.getState().toJS().detailsModal);

      done();
    }, 50);
  });

});
