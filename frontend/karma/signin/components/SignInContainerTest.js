import { assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import _ from 'lodash';

import defaultOptions from '../DefaultOptions';

import SignInContainer from 'components/SignInContainer';
import SignIn from 'components/SignIn';
import ChooseConnection from 'components/ChooseConnection/ChooseConnection';

describe('<SignInContainer />', () => {
  const translate = () => '';
  describe('choose connection', () => {
    const optionsWithConnections = _.cloneDeep(defaultOptions);
    optionsWithConnections.connections = [
        {"name": "Montana", "connection": "data.montana.gov", "image": "https://valid-image-path.com/image.png"}
    ];

    it('renders choose connection if connections are present', () => {
      const wrapper = shallow(<SignInContainer options={optionsWithConnections} translate={translate} />);
      assert.lengthOf(wrapper.find(ChooseConnection), 1);
      assert.lengthOf(wrapper.find(SignIn), 0);
    });

    it('renders sign in if no connections are present', () => {
      const wrapper = mount(<SignInContainer options={defaultOptions} translate={translate} />);
      assert.lengthOf(wrapper.find(ChooseConnection), 0);
      assert.lengthOf(wrapper.find(SignIn), 1);
    });

    it('shows login form after clicking Socrata ID button and allows going back', () => {
      const wrapper = mount(<SignInContainer options={optionsWithConnections} translate={translate} />);

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
      const wrapper = shallow(<SignInContainer options={optionsWithFormMessage} translate={translate} />);
      assert.lengthOf(wrapper.find('.signin-form-message'), 1);
    });

    it('renders no message when message is blank', () => {
      const wrapper = shallow(<SignInContainer options={defaultOptions} translate={translate} />);
      assert.lengthOf(wrapper.find('.signin-form-message'), 0);
    });
  });
});
