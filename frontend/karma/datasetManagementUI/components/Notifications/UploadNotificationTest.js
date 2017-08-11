import React from 'react';
import { shallow } from 'enzyme';
import { assert } from 'chai';
import UploadNotification from 'components/Notifications/UploadNotification';

describe('components/Notifications/UploadNotification', () => {
  const defaultProps = {
    notification: {
      id: '75973bf0-0cf0-450f-ad88-40e2050dad7b',
      kind: 'source',
      callId: 'cb2fe2fe-52c3-4812-a951-51ec5a9e77b6',
      sourceId: 121
    },
    source: {
      id: 121,
      created_by: {
        user_id: 'tugg-ikce',
        email: 'brandon.webster@socrata.com',
        display_name: 'branweb'
      },
      created_at: '2017-06-15T16:13:56.789297',
      source_type: {
        type: 'upload',
        filename: 'petty_crimes.csv',
      },
      percentCompleted: 90
    },
    notificationId: '75973bf0-0cf0-450f-ad88-40e2050dad7b',
    apiCall: {
      status: 'STATUS_CALL_IN_PROGRESS'
    }
  };

  it('renders the correct kind of notification depending on callStatus', () => {
    let component = shallow(<UploadNotification {...defaultProps} />);

    assert.equal(component.prop('status'), 'inProgress');

    const newProps = {
      ...defaultProps,
      apiCall: {
        status: 'STATUS_CALL_SUCCEEDED'
      }
    };

    component = shallow(<UploadNotification {...newProps} />);

    assert.equal(component.prop('status'), 'success');
  });

  it('renders a "lost connection" error if we don\'t have a specific error message', () => {
    const newProps = {
      ...defaultProps,
      apiCall: {
        ...defaultProps.apiCall,
        status: 'STATUS_CALL_FAILED'
      }
    };

    const component = shallow(<UploadNotification {...newProps} />);
    assert.equal(component.prop('status'), 'error');
    assert.include(component.find('.msgContainer').text(), 'Lost Connection');
  });

  it('renders a specific error message when the API gives it', () => {
    const newProps = {
      ...defaultProps,
      apiCall: {
        ...defaultProps.apiCall,
        status: 'STATUS_CALL_FAILED',
        error: {
          reason: 'Multilayer shapefiles are not supported.',
          message: 'your request had invalid values'
        }
      }
    };

    const component = shallow(<UploadNotification {...newProps} />);
    assert.equal(component.prop('status'), 'error');
    assert.include(component.find('.msgContainer').text(), 'Multilayer shapefiles are not supported.');
  });

});
