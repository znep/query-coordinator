import { assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import _ from 'lodash';

import defaultOptions from '../../DefaultOptions';

import SignInForm from 'authentication/components/SignInForm/SignInForm';
import PasswordInput from 'authentication/components/SignInForm/PasswordInput';

describe('<SignInForm />', () => {
  const defaultProps = {
    doAuth0Authorize: () => { },
    doAuth0Login: () => { },
    onLoginStart: () => { },
    onLoginError: () => { },
    options: defaultOptions
  };

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

  describe('renders error or spinner', () => {
    it('renders spinner', () => {
      const wrapper = shallow(<SignInForm {...defaultProps} />);
      wrapper.setState({ loggingIn: true });
      assert.lengthOf(wrapper.find('.signin-form-spinner'), 1);
      assert.lengthOf(wrapper.find('.signin-form-error'), 0);
    });

    it('renders errors', () => {
      const wrapper = shallow(<SignInForm {...defaultProps} />);
      wrapper.setState({ error: "Couldn't log ya in!" });
      assert.lengthOf(wrapper.find('.signin-form-error'), 1);

      // if we have an error, spinner shouldn't be visibile
      assert.lengthOf(wrapper.find('.signin-form-spinner'), 0);
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
      wrapperWithAllowUsernamePasswordLogin.instance().onEmailChange({ target: { value: 'fakey@socrata.com' } });
    });

    it('does not grab connection', () => {
      assert.equal(wrapperWithAllowUsernamePasswordLogin.state().email, 'fakey@socrata.com');
      assert.isNull(wrapperWithAllowUsernamePasswordLogin.state().connectionName);
    });
  });

  describe('onEmailChange', () => {
    let wrapperWithSocrataEmail;

    beforeEach(() => {
      wrapperWithSocrataEmail = shallow(<SignInForm {...propsWithAuth0Connections} />);
      wrapperWithSocrataEmail.instance().onEmailChange({ target: { value: '@socrata.com' } });
    });

    it('grabs connection', () => {
      assert.equal(wrapperWithSocrataEmail.state().email, '@socrata.com');
      assert.equal(wrapperWithSocrataEmail.state().connectionName, 'socrata-okta-sts');
    });

    it('blanks out connection', () => {
      wrapperWithSocrataEmail.instance().onEmailChange({ target: { value: '@example.com' } });
      assert.equal(wrapperWithSocrataEmail.state().email, '@example.com');
      assert.isNotOk(wrapperWithSocrataEmail.state().connectionName);
    });

    it('blanks out email when invalid', () => {
      wrapperWithSocrataEmail.instance().onEmailChange({ target: { value: 'garbage' } });
      assert.propertyVal(wrapperWithSocrataEmail.state(), 'email', null);
      assert.propertyVal(wrapperWithSocrataEmail.state(), 'connectionName', null);
    });

    it('renders "SSO Enabled" when a connection is found', () => {
      wrapperWithSocrataEmail = mount(<SignInForm {...propsWithAuth0Connections} />);
      wrapperWithSocrataEmail.instance().onEmailChange({ target: { value: '@socrata.com' } });
      assert.equal(wrapperWithSocrataEmail.state().connectionName, 'socrata-okta-sts');
      wrapperWithSocrataEmail.update();

      const passwordInput = wrapperWithSocrataEmail.find(PasswordInput);
      const passwordContainer = passwordInput.find('.signin-password-input-container');
      assert.lengthOf(passwordContainer, 1);
      assert.equal(passwordContainer.get(0).style.visibility, 'hidden');

      const ssoEnabledContainer = passwordInput.find('.signin-sso-enabled-container');
      assert.lengthOf(ssoEnabledContainer, 1);
      assert.equal(ssoEnabledContainer.get(0).style.visibility, 'visible');
    });

    it('renders password field when no connection is found', () => {
      wrapperWithSocrataEmail = mount(<SignInForm {...propsWithAuth0Connections} />);
      wrapperWithSocrataEmail.instance().onEmailChange({ target: { value: 'garbage' } });
      assert.propertyVal(wrapperWithSocrataEmail.state(), 'connectionName', null);
      wrapperWithSocrataEmail.update();

      const passwordInput = wrapperWithSocrataEmail.find(PasswordInput);
      const passwordContainer = passwordInput.find('.signin-password-input-container');
      assert.lengthOf(passwordContainer, 1);
      assert.equal(passwordContainer.get(0).style.visibility, 'visible');

      const ssoEnabledContainer = passwordInput.find('.signin-sso-enabled-container');
      assert.lengthOf(ssoEnabledContainer, 1);
      assert.equal(ssoEnabledContainer.get(0).style.visibility, 'hidden');
    });
  });

  describe('spoofing', () => {
    let wrapper;

    const spoofedEmail = 'user@email.com superadmin@socrata.com';

    beforeEach(() => {
      wrapper = shallow(<SignInForm {...propsWithAuth0Connections} />);
    });

    it('does not render SSO enabled when spoofing', () => {
      wrapper = mount(<SignInForm {...propsWithAuth0Connections} />);
      wrapper.instance().onEmailChange({ target: { value: spoofedEmail } });
      wrapper.update();

      assert.propertyVal(wrapper.state(), 'connectionName', null);

      const passwordInput = wrapper.find(PasswordInput);
      const ssoEnabledContainer = passwordInput.find('.signin-sso-enabled-container');
      assert.lengthOf(ssoEnabledContainer, 1);
      assert.equal(ssoEnabledContainer.get(0).style.visibility, 'hidden');
    });

    it('properly detects spoofing', () => {
      wrapper.instance().onEmailChange({ target: { value: spoofedEmail } });
      wrapper.update();

      assert.propertyVal(wrapper.state(), 'connectionName', null);
      assert.propertyVal(wrapper.state(), 'email', spoofedEmail);
      assert.propertyVal(wrapper.state(), 'spoofing', true);
    });

    it('properly un-detects spoofing', () => {
      wrapper.instance().onEmailChange({ target: { value: spoofedEmail } });
      wrapper.update();

      assert.propertyVal(wrapper.state(), 'spoofing', true);

      wrapper.instance().onEmailChange({ target: { value: 'no-longer-spoofed@email.com' } });
      wrapper.update();

      assert.propertyVal(wrapper.state(), 'spoofing', false);
    });

    it('properly detects SSO after entering spoofed email then going back', () => {
      wrapper.instance().onEmailChange({ target: { value: spoofedEmail } });
      wrapper.update();

      assert.propertyVal(wrapper.state(), 'spoofing', true);
      assert.propertyVal(wrapper.state(), 'connectionName', null);

      wrapper.instance().onEmailChange({ target: { value: '@socrata.com' } });
      wrapper.update();

      assert.propertyVal(wrapper.state(), 'spoofing', false);
      assert.propertyVal(wrapper.state(), 'connectionName', 'socrata-okta-sts');
    });

    it('does not spoof unless both emails are valid', () => {
      wrapper.instance().onEmailChange({ target: { value: 'valid@email.com not-valid-at-all' } });
      wrapper.update();

      assert.propertyVal(wrapper.state(), 'spoofing', false);

      wrapper.instance().onEmailChange({ target: { value: 'not-valid-at-all valid@email.com' } });
      wrapper.update();

      assert.propertyVal(wrapper.state(), 'spoofing', false);

      wrapper.instance().onEmailChange({ target: { value: spoofedEmail } });
      wrapper.update();

      assert.propertyVal(wrapper.state(), 'spoofing', true);
    });
  });

  describe('social linking', () => {
    const optionsWithSocialLink = _.cloneDeep(defaultOptions);
    optionsWithSocialLink.linkingSocial = true;

    const propsWithSocialLink = _.cloneDeep(defaultProps);
    propsWithSocialLink.options = optionsWithSocialLink;

    it('has the proper action url when not linking', () => {
      const wrapper = mount(<SignInForm {...defaultProps} />);
      assert.isTrue(wrapper.find('form').get(0).action.indexOf('/user_sessions') > -1);
    });

    it('has the proper action url when linking', () => {
      const wrapper = mount(<SignInForm {...propsWithSocialLink} />);
      assert.isTrue(wrapper.find('form').get(0).action.indexOf('/auth/auth0/link') > -1);
    });
  });
});
