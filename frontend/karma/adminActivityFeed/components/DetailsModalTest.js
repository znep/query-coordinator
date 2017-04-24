import {fromJS} from 'immutable';
import moment from 'moment';
import React from 'react';
import { expect } from 'chai';
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
          reason: 'because..'
        }
      },
      created_at: '2000-01-01',
      service: 'data.service'
    },
    dataset: {
      name: 'dataset.name'
    },
    initiated_by: {
      displayName: 'initiated_by.displayName'
    },
    file_name: 'file_name'
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

    expect(title).to.eq(expectedTitle);
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
    const lineActivityFilename = output.querySelector('#line-activity-filename').textContent;

    expect(lineActivityType).to.eq(mockActivity.data.activity_type);
    expect(lineActivityName).to.eq(mockActivity.dataset.name);
    expect(lineActivityEventTitle).to.eq(
      mockTranslations.show_page.
        event_messages[mockActivity.data.status][mockActivity.data.latest_event.event_type].
        title
    );
    expect(lineActivityEventDesc).to.eq(
      mockTranslations.show_page.
        event_messages[mockActivity.data.status][mockActivity.data.latest_event.event_type].
        description.replace('%{reason}', mockActivity.data.latest_event.info.reason)
    );
    expect(lineActivityInitiatedAt).to.eq(
      mockTranslations.initiated_at + ': ' +
      moment(mockActivity.data.created_at).format('LLL')
    );
    expect(lineActivityStartedBy).to.eq(
      mockTranslations.started_by + ': ' +
      mockActivity.initiated_by.displayName
    );
    expect(lineActivityImportMethod).to.eq(
      mockTranslations.import_method + ': ' +
      mockActivity.data.service
    );
    expect(lineActivityFilename).to.eq(mockActivity.file_name);
  });

  it('close button should fire close event', (done) => {
    const output = renderComponentWithLocalization(DetailsModal, {}, store);

    expect(store.getState().toJS().detailsModal).to.not.be.null;

    Simulate.click(output.querySelector('.btn-default'));

    setTimeout(() => {
      expect(store.getState().toJS().detailsModal).to.be.null;

      done();
    }, 50);
  });

});
