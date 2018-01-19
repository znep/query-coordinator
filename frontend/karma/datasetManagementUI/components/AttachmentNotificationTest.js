import React from 'react';
import { shallow } from 'enzyme';
import { assert } from 'chai';
import AttachmentNotification from 'datasetManagementUI/components/AttachmentNotification/AttachmentNotification';
import moment from 'moment';

describe('components/AttachmentNotification', () => {
  const defaultProps = {
    filename: 'foo.gif',
    percent: 0,
    status: 'inProgress'
  };

  it('renders the correct kind of notification', () => {
    let component = shallow(<AttachmentNotification {...defaultProps} />);

    assert.equal(component.prop('status'), 'inProgress');

    const newProps = {
      ...defaultProps,
      status: 'success'
    };

    component = shallow(<AttachmentNotification {...newProps} />);

    assert.equal(component.prop('status'), 'success');
  });


  it('renders a specific error message when we pass it an error response', () => {
    const newProps = {
      ...defaultProps,
      status: 'error',
      error: {
        english: 'computers suck'
      }
    };

    const component = shallow(<AttachmentNotification {...newProps} />);
    assert.equal(component.prop('status'), 'error');
  });
});
