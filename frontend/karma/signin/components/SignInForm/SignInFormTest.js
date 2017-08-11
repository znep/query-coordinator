import { expect, assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import _ from 'lodash';

import defaultOptions from '../../DefaultOptions';

import SignInForm from 'components/SignInForm/SignInForm';
import PasswordInput from 'components/SignInForm/PasswordInput';
import RememberMe from 'components/SignInForm/RememberMe';
import PollingInput from 'components/SignInForm/PollingInput';

describe('<SignInForm />', () => {
  const defaultProps = {
    translate: () => '',
    doAuth0Authorize: () => { },
    doAuth0Login: () => { },
    onLoginStart: () => { },
    onLoginError: () => { },
    options: defaultOptions
  };

  describe('remember me', () => {
    it('renders remember me when remember me is true', () => {
      const props = _.cloneDeep(defaultProps);
      props.options.rememberMe = true;
      const wrapper = shallow(<SignInForm {...props} />);
      expect(wrapper.find(RememberMe)).to.have.length(1);
    });

    it('does not render remember me when remember me is false', () => {
      const props = _.cloneDeep(defaultProps);
      props.options.rememberMe = false;
      const wrapper = shallow(<SignInForm {...props} />);
      expect(wrapper.find(RememberMe)).to.have.length(0);
    });
  });

  describe('renders error or spinner', () => {
    it('renders spinner', () => {
      const wrapper = shallow(<SignInForm {...defaultProps} />);
      wrapper.setState({ loggingIn: true });
      expect(wrapper.find('.signin-form-spinner')).to.have.length(1);
      expect(wrapper.find('.signin-form-error')).to.have.length(0);
    });

    it('renders errors', () => {
      const wrapper = shallow(<SignInForm {...defaultProps} />);
      wrapper.setState({ error: "Couldn't log ya in!" });
      expect(wrapper.find('.signin-form-error')).to.have.length(1);

      // if we have an error, spinner shouldn't be visibile
      expect(wrapper.find('.signin-form-spinner')).to.have.length(0);
    });
  });

  describe('allowUsernamePasswordLogin', () => {
    const propsWithAllowUsernamePasswordLogin = _.cloneDeep(defaultProps);
    propsWithAllowUsernamePasswordLogin.options.allowUsernamePasswordLogin = true;
    propsWithAllowUsernamePasswordLogin.auth0Connections = [
      {
        domain_aliases: ['socrata.com'],
        name: 'socrata-okta-sts',
        status: true
      }
    ];

    let wrapperWithAllowUsernamePasswordLogin;

    beforeEach(() => {
      wrapperWithAllowUsernamePasswordLogin = shallow(<SignInForm {...propsWithAllowUsernamePasswordLogin} />);
      wrapperWithAllowUsernamePasswordLogin.instance().onEmailChange('fakey@socrata.com');
    });

    it('does not grab connection', () => {
      expect(wrapperWithAllowUsernamePasswordLogin.state().email).to.equal('fakey@socrata.com');
      expect(wrapperWithAllowUsernamePasswordLogin.state().connectionName).to.not.exist;
    });
  });

  describe('onEmailChange', () => {
    const propsWithAuth0Connections = _.cloneDeep(defaultProps);
    propsWithAuth0Connections.auth0Connections = [
      {
        domain_aliases: ['socrata.com'],
        name: 'socrata-okta-sts',
        status: true
      },
      {
        domain_aliases: ['some-domain.gov'],
        name: 'some-domain-dev-blah',
        status: true
      },
      {
        domain_aliases: ['disabled.com'],
        name: 'disabled',
        status: false
      }
    ];

    let wrapperWithSocrataEmail;

    beforeEach(() => {
      wrapperWithSocrataEmail = shallow(<SignInForm {...propsWithAuth0Connections} />);
      wrapperWithSocrataEmail.instance().onEmailChange('@socrata.com');
    });

    it('grabs connection', () => {
      expect(wrapperWithSocrataEmail.state().email).to.equal('@socrata.com');
      expect(wrapperWithSocrataEmail.state().connectionName).to.equal('socrata-okta-sts');
    });

    it('blanks out connection', () => {
      wrapperWithSocrataEmail.instance().onEmailChange('@example.com');
      expect(wrapperWithSocrataEmail.state().email).to.equal('@example.com');
      assert.isNotOk(wrapperWithSocrataEmail.state().connectionName);
    });

    it('blanks out email when invalid', () => {
      wrapperWithSocrataEmail.instance().onEmailChange('garbage');
      assert.propertyVal(wrapperWithSocrataEmail.state(), 'email', null);
      assert.propertyVal(wrapperWithSocrataEmail.state(), 'connectionName', null);
    });

    it('renders "SSO Enabled" when a connection is found', () => {
      expect(wrapperWithSocrataEmail.state().connectionName).to.equal('socrata-okta-sts');

      const passwordInput = wrapperWithSocrataEmail.find(PasswordInput).shallow();
      expect(passwordInput.find('.signin-password-sso-enabled-text')).to.have.length(1);
      expect(passwordInput.find(PollingInput)).to.have.length(0);
    });

    it('renders password field when no connection is found', () => {
      wrapperWithSocrataEmail.instance().onEmailChange('garbage');
      assert.propertyVal(wrapperWithSocrataEmail.state(), 'connectionName', null);

      const passwordInput = wrapperWithSocrataEmail.find(PasswordInput).shallow();
      expect(passwordInput.find('.signin-password-sso-enabled-text')).to.have.length(0);
      expect(passwordInput.find(PollingInput)).to.have.length(1);
    });
  });
});
