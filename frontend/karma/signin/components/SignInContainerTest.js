import { assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import _ from 'lodash';

import defaultOptions from '../DefaultOptions';

import SignInContainer from 'components/SignInContainer';
import SignIn from 'components/SignIn';
import ChooseConnection from 'components/ChooseConnection/ChooseConnection';
import SocialLinkMessage from 'components/SocialLinkMessage';

describe('<SignInContainer />', () => {
  describe('choose connection', () => {
    const optionsWithConnections = _.cloneDeep(defaultOptions);
    optionsWithConnections.connections = [
        {"name": "Montana", "connection": "data.montana.gov", "image": "https://valid-image-path.com/image.png"}
    ];

    it('renders choose connection if connections are present', () => {
      const wrapper = shallow(<SignInContainer options={optionsWithConnections} />);
      assert.lengthOf(wrapper.find(ChooseConnection), 1);
      assert.lengthOf(wrapper.find(SignIn), 0);
    });

    it('renders sign in if no connections are present', () => {
      const wrapper = mount(<SignInContainer options={defaultOptions} />);
      assert.lengthOf(wrapper.find(ChooseConnection), 0);
      assert.lengthOf(wrapper.find(SignIn), 1);
    });

    it('shows login form after clicking Socrata ID button and allows going back', () => {
      const wrapper = mount(<SignInContainer options={optionsWithConnections} />);

      // clicking Socrata ID button goes to SignIn component
      wrapper.find('.signin-button-socrata-id').simulate('click');
      assert.lengthOf(wrapper.find(ChooseConnection), 0);
      assert.lengthOf(wrapper.find(SignIn), 1);

      // click the back button goes back to choose connection
      wrapper.find('.signin-button-back-to-options').simulate('click');
      assert.lengthOf(wrapper.find(SignIn), 0);
      assert.lengthOf(wrapper.find(ChooseConnection), 1);
    });
  });

  describe('form message', () => {
    const optionsWithFormMessage = _.cloneDeep(defaultOptions);
    optionsWithFormMessage.formMessage = "This is a <strong>form message</strong>";

    it('renders form message when set', () => {
      const wrapper = shallow(<SignInContainer options={optionsWithFormMessage} />);
      assert.lengthOf(wrapper.find('.signin-form-message'), 1);
    });

    it('renders no message when message is blank', () => {
      const wrapper = shallow(<SignInContainer options={defaultOptions} />);
      assert.lengthOf(wrapper.find('.signin-form-message'), 0);
    });
  });

  describe('social link message', () => {
    const optionsWithSocialLink = _.cloneDeep(defaultOptions);
    optionsWithSocialLink.linkingSocial = true;

    it('does not render social link message when not linking', () => {
      const wrapper = shallow(<SignInContainer options={defaultOptions} />);
      assert.lengthOf(wrapper.find(SocialLinkMessage), 0);
    });

    it('renders social link message when linking', () => {
      const wrapper = shallow(<SignInContainer options={optionsWithSocialLink} />);
      assert.lengthOf(wrapper.find(SocialLinkMessage), 1);
    });
  });
});
