import { assert } from 'chai';
import React from 'react';
import { mount } from 'enzyme';
import _ from 'lodash';
import sinon from 'sinon';

import LoginModal from 'authentication/components/LoginModal';
import { Modal, ModalHeader, ModalContent, ModalFooter } from 'common/components/Modal';

describe('<LoginModal />', () => {
  const defaultModalConfig = {
    title: 'Test Title',
    acceptButtonText: 'Test Accept Text',
    cancelButtonText: 'Test Cancel Text',
    text: 'This is a government system blah blah blah'
  };

  describe('defaults', () => {
    const defaultWrapper = mount(
      <LoginModal
        modalConfig={defaultModalConfig}
        onConfirm={() => {}}
        onCancel={() => {}} />
    );

    it('render a modal', () => {
      assert.lengthOf(defaultWrapper.find(Modal), 1);
      assert.lengthOf(defaultWrapper.find(ModalHeader), 1);
      assert.lengthOf(defaultWrapper.find(ModalContent), 1);
      assert.lengthOf(defaultWrapper.find(ModalFooter), 1);
    });

    it('renders the proper title', () => {
      const header = defaultWrapper.find(ModalHeader);

      assert.lengthOf(header, 1);

      assert.equal(header.text(), defaultModalConfig.title);
    });

    it('renders the proper text', () => {
      const body = defaultWrapper.find(ModalContent);

      assert.lengthOf(body, 1);

      assert.equal(body.text(), defaultModalConfig.text);
    });

    it('renders the proper confirm button', () => {
      const confirm = defaultWrapper.find('.btn .btn-primary');

      assert.lengthOf(confirm, 1);

      assert.equal(confirm.text(), defaultModalConfig.acceptButtonText);
    });

    it('renders the proper cancel button', () => {
      const cancel = defaultWrapper.find('.btn .btn-default');

      assert.lengthOf(cancel, 1);

      assert.equal(cancel.text(), defaultModalConfig.cancelButtonText);
    });
  });

  describe('hiding the cancel button', () => {
    it('hides the cancel button if the config is set', () => {
      const hiddenButtonConfig = _.cloneDeep(defaultModalConfig);
      hiddenButtonConfig.hideCancelButton = true;

      const wrapper = mount(
        <LoginModal
          modalConfig={hiddenButtonConfig}
          onConfirm={() => {}}
          onCancel={() => {}} />
      );

      assert.lengthOf(wrapper.find('.btn .btn-default'), 0);
    });

    it('shows the cancel button if the config is set', () => {
      const notHiddenButtonConfig = _.cloneDeep(defaultModalConfig);
      notHiddenButtonConfig.hideCancelButton = false;

      const wrapper = mount(
        <LoginModal
          modalConfig={notHiddenButtonConfig}
          onConfirm={() => {}}
          onCancel={() => {}} />
      );

      assert.lengthOf(wrapper.find('.btn .btn-default'), 1);
    });
  });

  describe('button clicks', () => {
    let wrapper;
    let onConfirm;
    let onCancel;

    beforeEach(() => {
      onConfirm = sinon.spy();
      onCancel = sinon.spy();

      wrapper = mount(
        <LoginModal
          modalConfig={defaultModalConfig}
          onConfirm={onConfirm}
          onCancel={onCancel} />
      );
    });

    it('calls onConfirm', () => {
      wrapper.find('.btn .btn-primary').simulate('click');
      assert.isTrue(onConfirm.calledOnce);
      assert.isFalse(onCancel.calledOnce);
    });

    it('calls onCanel', () => {
      wrapper.find('.btn .btn-default').simulate('click');
      assert.isTrue(onCancel.calledOnce);
      assert.isFalse(onConfirm.calledOnce);
    });
  });
});
