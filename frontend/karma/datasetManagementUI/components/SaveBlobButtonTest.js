import { assert } from 'chai';
import { shallow } from 'enzyme';
import React from 'react';
import SaveBlobButton from 'datasetManagementUI/components/SaveBlobButton/SaveBlobButton';
import sinon from 'sinon';

describe('SaveBlobButton', () => {

  const props = {
    revision: {},
    source: {'id': 1},
    saveCurrentBlob: sinon.spy()
  }

  const component = shallow(<SaveBlobButton {...props} />)

  it('renders', () => {
    assert.isTrue(component.exists());
  });

  it('calls the saveCurrentBlob function when clicked', () => {
      component.find('Connect(ApiCallButton)').simulate('click');
      assert.isTrue(props.saveCurrentBlob.calledOnce);
  });
})
