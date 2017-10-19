import sinon from 'sinon';
import { assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import AttachmentsInput from 'components/AttachmentsInput/AttachmentsInput';

const props = {
  name: 'tags',
  label: 'Attachments',
  value: [{ assetId: 'meh', name: 'meh!', filename: 'meh.exe' }],
  isPrivate: false,
  isRequired: false,
  placeholder: false,
  inErrorState: false,
  setValue: sinon.spy(),
  uploadAttachment: sinon.spy(),
  removeAttachment: sinon.spy(),
  editAttachment: sinon.spy()
};

describe('components/AttachmentsInput', () => {
  describe('rendering', () => {
    let component;

    beforeEach(() => {
      component = shallow(<AttachmentsInput {...props} />);
    });

    it('renders a file input', () => {
      assert.equal(component.find('input[type="file"]').length, 1);
    });

    it('renders an add button', () => {
      assert.equal(component.find('#add-attachment').length, 1);
    });

    it('renders a tag component for each tag in the form data-model', () => {
      assert.equal(component.find('Attachment').length, 1);
    });
  });

  describe('behavior', () => {
    let component;

    beforeEach(() => {
      component = mount(<AttachmentsInput {...props} />);
    });

    it('calls proper callback functions when label is clicked', () => {
      const addBtn = component.find('#file');
      addBtn.simulate('change', {target: {files: [{dummyFile: true}]}});

      assert.isTrue(component.props().uploadAttachment.calledOnce);
    });

    it('calls edit callback when text is changed', () => {
      const inputField = component.find('.filename');

      inputField.simulate('change', { target: { value: 'hey' } });
      const [attachment, newName] = component.props().editAttachment.getCall(0).args;
      assert.equal(attachment, props.value[0]);
      assert.equal(newName, 'hey');

    });

    it('calls remove callback when remove icon is clicked', () => {
      const rm = component.find('a.removeButton');
      rm.simulate('click', {});

      const [attachment] = component.props().removeAttachment.getCall(0).args;
      assert.equal(attachment, props.value[0]);
    });
  });
});
