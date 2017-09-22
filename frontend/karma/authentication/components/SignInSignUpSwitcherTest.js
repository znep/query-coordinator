import { assert } from 'chai';
import React from 'react';
import { mount, shallow } from 'enzyme';
import _ from 'lodash';
import sinon from 'sinon';

import SignInSignUpSwitcher from 'components/SignInSignUpSwitcher';
import SignIn from 'components/SignIn';
import SignInContainer from 'components/SignInContainer';
import SignUp from 'components/SignUp';
import LoginModal from 'components/LoginModal';

import defaultOptions from '../DefaultOptions';

describe('<SignInSignUpSwitcher />', () => {
  describe('switching', () => {
    it('renders signin', () => {
      const wrapper = shallow(
        <SignInSignUpSwitcher signin={true} options={defaultOptions} />
      );

      assert.lengthOf(wrapper.find(SignInContainer), 1);
    });

    it('renders signup', () => {
      const wrapper = shallow(
        <SignInSignUpSwitcher signin={false} options={defaultOptions} />
      );

      assert.lengthOf(wrapper.find(SignUp), 1);
    });
  });

  describe('modal', () => {
    const modalOptions = _.cloneDeep(defaultOptions);
    modalOptions.modalConfig = {
      text: 'This is a government system blah blah blah'
    };

    let wrapper;

    beforeEach(() => {
      wrapper = mount(
        <SignInSignUpSwitcher signin={true} options={modalOptions} />
      );
    });

    it('renders modal', () => {
      assert.lengthOf(wrapper.find(LoginModal), 1);
    });

    it('hides modal on accept', () => {
      let modal = wrapper.find(LoginModal);

      assert.lengthOf(modal, 1);

      modal.find('.btn .btn-primary').simulate('click');

      assert.lengthOf(wrapper.find(LoginModal), 0);
      assert.lengthOf(wrapper.find(SignInContainer), 1);
    });
  });
});
