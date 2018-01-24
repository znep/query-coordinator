import { assert } from 'chai';
import React from 'react';
import sinon from 'sinon';
import { shallow } from 'enzyme';
import ApiCallButton from 'datasetManagementUI/components/ApiCallButton/ApiCallButton';
import {
  STATUS_CALL_IN_PROGRESS,
  STATUS_CALL_SUCCEEDED,
  STATUS_CALL_FAILED
} from 'datasetManagementUI/lib/apiCallStatus';

describe('components/ApiCallButton', () => {
  let props;

  beforeEach(() => {
    props = {
      status: null,
      onClick: sinon.spy(),
      additionalClassName: '',
      children: <span>clicky</span>,
      forceDisable: false
    };
  });

  it('renders spinner if status is in progress', () => {
    const newProps = {
      ...props,
      status: STATUS_CALL_IN_PROGRESS
    };

    const component = shallow(<ApiCallButton {...newProps} />);

    assert.equal(component.find('.spinner-default').length, 1);
  });

  it('renders success styles if status is successful', () => {
    const newProps = {
      ...props,
      status: STATUS_CALL_SUCCEEDED
    };

    const component = shallow(<ApiCallButton {...newProps} />);

    assert.equal(component.find('.btn-success').length, 1);
  });

  it('renders error styles if status is failed', () => {
    const newProps = {
      ...props,
      status: STATUS_CALL_FAILED
    };

    const component = shallow(<ApiCallButton {...newProps} />);

    assert.equal(component.find('.btn-error').length, 1);
  });

  it('renders base styles if status is unknown', () => {
    const component = shallow(<ApiCallButton {...props} />);

    assert.equal(component.find('.btn-primary').length, 1);
  });

  it('calls its onClick hander when clicked', () => {
    const component = shallow(<ApiCallButton {...props} />);

    component.simulate('click');

    assert.isTrue(props.onClick.calledOnce);
  });

  it('allows force disabling via props', () => {
    const newProps = {
      ...props,
      forceDisable: true
    };

    const component = shallow(<ApiCallButton {...newProps} />);

    assert.isTrue(component.prop('disabled'));
  });
});
