import { assert } from 'chai';
import React from 'react';
import { shallow, mount } from 'enzyme';
import _ from 'lodash';

import defaultOptions from '../../DefaultOptions';

import SignInForm from 'components/SignInForm/SignInForm';
import PasswordInput from 'components/SignInForm/PasswordInput';

describe('<SignInForm />', () => {
  const defaultProps = {
    doAuth0Authorize: () => { },
    doAuth0Login: () => { },
    onLoginStart: () => { },
    onLoginError: () => { },
    options: defaultOptions
  };

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
});
