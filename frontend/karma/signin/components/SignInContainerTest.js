import { expect, assert } from 'chai';
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
      expect(wrapper.find(ChooseConnection)).have.length(1);
      expect(wrapper.find(SignIn)).to.have.length(0);
    });

    it('renders sign in if no connections are present', () => {
      const wrapper = mount(<SignInContainer options={defaultOptions} translate={translate} />);
      expect(wrapper.find(ChooseConnection)).have.length(0);
      expect(wrapper.find(SignIn)).to.have.length(1);
    });

    if(new RegExp(/PhantomJS\/1\.9\.8\.*/).test(navigator.userAgent)) {
      console.warn('SKIPPING TESTS DUE TO OLD VERSION OF PhantomJS!!! See EN-12757');
    } else {
      it('shows login form after clicking Socrata ID button and allows going back', () => {
        const wrapper = mount(<SignInContainer options={optionsWithConnections} />);
        
        // clicking Socrata ID button goes to SignIn component
        wrapper.find('.signin-button-socrata-id').simulate('click');
        expect(wrapper.find(ChooseConnection)).to.have.length(0);
        expect(wrapper.find(SignIn)).to.have.length(1);

        // click the back button goes back to choose connection
        wrapper.find('.signin-button-back-to-options').simulate('click');
        expect(wrapper.find(SignIn)).to.have.length(0);
        expect(wrapper.find(ChooseConnection)).to.have.length(1);
      });
    }
  });

  describe('form message', () => {
    const optionsWithFormMessage = _.cloneDeep(defaultOptions);
    optionsWithFormMessage.formMessage = "This is a <strong>form message</strong>";

    it('renders form message when set', () => {
      const wrapper = shallow(<SignInContainer options={optionsWithFormMessage} translate={translate} />);
      expect(wrapper.find('.signin-form-message')).to.have.length(1);
    });

    it('renders no message when message is blank', () => {
      const wrapper = shallow(<SignInContainer options={defaultOptions} translate={translate} />);
      expect(wrapper.find('.signin-form-message')).to.have.length(0);
    });
  });
});
