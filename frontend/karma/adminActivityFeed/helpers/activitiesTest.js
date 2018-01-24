import _ from 'lodash';
import immutable from 'immutable';
import { expect, assert } from 'chai';

import testStore from '../testStore';
import * as activitiesHelpers from 'adminActivityFeed/helpers/activities';

describe('Activity helpers, ', () => {
  it('getEntityType should return correct asset type', () => {
    const expectedTypes = [
      {
        type: 'story',
        activity: immutable.fromJS({
          dataset: {
            displayType: 'story'
          }
        })
      },
      {
        type: 'chart',
        activity: immutable.fromJS({
          dataset: {
            displayType: 'chart'
          }
        })
      },
      {
        type: 'filtered_view',
        activity: immutable.fromJS({
          dataset: {
            metadata: {
              jsonQuery: {
                where: ''
              }
            }
          }
        })
      },
      {
        type: 'dataset',
        activity: immutable.fromJS({
          dataset: {}
        })
      }
    ];

    expectedTypes.forEach((expectedType) => {
      const type = activitiesHelpers.getEntityType(expectedType.activity);
      expect(type).to.eq(expectedType.type);
    });
  });

  it('getType should return activity type in snake case format', () => {
    const activity = immutable.fromJS({
      data: {
        activity_type: 'Working Copy'
      }
    });

    expect(activitiesHelpers.getType(activity)).to.eq('working_copy');
  });

  it('getStatus should return status in snake case format', () => {
    const activity = immutable.fromJS({
      data: {
        status: 'Some Status'
      }
    });

    expect(activitiesHelpers.getStatus(activity)).to.eq('some_status');
  });

  it('getUrl should return correct url for different asset types', () => {
    const expectedUrls = [
      {
        url: '/stories/s/xxxx-xxxx',
        activity: immutable.fromJS({
          dataset: {
            name: 'My Story',
            id: 'xxxx-xxxx',
            displayType: 'story'
          }
        })
      },
      {
        url: '/d/xxxx-xxxx',
        activity: immutable.fromJS({
          dataset: {
            name: 'My Chart',
            id: 'xxxx-xxxx',
            displayType: 'chart'
          }
        })
      },
      {
        url: '/d/xxxx-xxxx',
        activity: immutable.fromJS({
          dataset: {
            name: 'My Filtered View',
            id: 'xxxx-xxxx',
            metadata: {
              jsonQuery: {
                where: ''
              }
            }
          }
        })
      },
      {
        url: '/d/xxxx-xxxx',
        activity: immutable.fromJS({
          dataset: {
            name: 'My Dataset',
            id: 'xxxx-xxxx'
          }
        })
      }
    ];

    expectedUrls.forEach((expectedUrl) => {
      const url = activitiesHelpers.getUrl(expectedUrl.activity);
      expect(url).to.eq(expectedUrl.url);
    });
  });
});

