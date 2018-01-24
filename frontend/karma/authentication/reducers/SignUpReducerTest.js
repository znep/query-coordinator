import { assert } from 'chai';
import sinon from 'sinon';
import _ from 'lodash';

import reducer from 'authentication/reducers/SignUpReducer';
import * as actions from 'authentication/actions';
import I18n from 'common/i18n';

/**
 * Reduces a given state by all the given actions
 * @param {object} initialState State to apply actions to
 * @param {array} signupActions Array of actions to apply
 */
function applyAllActions(initialState, signupActions) {
  return _.reduce(
    signupActions,
    (reducedState, action) => { return reducer({ ...reducedState }, action); },
    { ...defaultState }
  );
}

const defaultState = {
  formSubmitted: false,
  inputs: {
    email: {
      value: '',
      valid: true,
      message: '',
      required: true
    },
    screenName: {
      value: '',
      valid: true,
      message: '',
      required: true
    },
    password: {
      value: '',
      valid: true,
      message: '',
      required: true
    },
    passwordConfirm: {
      value: '',
      valid: true,
      message: '',
      required: true
    },
    recaptcha: {
      // since the recaptcha doesn't have a real "value" (it's just valid or invalid)
      // we mark it as required false, which skips checking if the value is empty or not
      valid: false,
      required: false
    }
  }
};

describe('SignUpReducer', () => {
  describe('inputChanged', () => {
    it('changes inputs', () => {
      const changeEmailAction =  actions.inputChanged('email', 'test');
      let newState = reducer({...defaultState}, changeEmailAction);
      assert.equal(newState.inputs.email.value, 'test');

      // again, again!!!
      const changeScreenNameAction =  actions.inputChanged('screenName', 'hello');
      newState = reducer({...newState}, changeScreenNameAction);
      assert.equal(newState.inputs.email.value, 'test');
      assert.equal(newState.inputs.screenName.value, 'hello');
    });
  });

  describe('validateEmail', () => {
    it('sets valid to true for valid emails', () => {
      const formActions = [
        actions.inputChanged('email', 'valid@email.com'),
        actions.validateEmail()
      ];
      const newState = applyAllActions({ ...defaultState }, formActions);

      assert.isTrue(newState.inputs.email.valid);
    });

    it('sets valid to false for invalid emails', () => {
      const formActions = [
        actions.inputChanged('email', 'invalidemail'),
        actions.validateEmail()
      ];
      const newState = applyAllActions({...defaultState}, formActions);

      assert.isFalse(newState.inputs.email.valid);
    });
  });

  describe('validatePassword', () => {
    it('sets valid to true when password is valid', () => {
      const formActions = [
        actions.inputChanged('password', 'FakeyFakey1234'),
        actions.validatePassword()
      ];
      const newState = applyAllActions({...defaultState}, formActions);

      assert.isTrue(newState.inputs.password.valid);
    });

    it('sets valid to false when password is short', () => {
      const formActions = [
        actions.inputChanged('password', 'short'),
        actions.validatePassword()
      ];
      const newState = applyAllActions({...defaultState}, formActions);

      assert.isFalse(newState.inputs.password.valid);
      assert.equal(newState.inputs.password.message, I18n.t('account.common.validation.password_short'));
    });

    it('sets valid to false when password is long', () => {
      const formActions = [
        actions.inputChanged('password', 'HelloIAmAVeryLongAndInvalidPasswordWhichIsADumbIdeaForSecurity'),
        actions.validatePassword()
      ];
      const newState = applyAllActions({...defaultState}, formActions);

      assert.isFalse(newState.inputs.password.valid);
      assert.equal(newState.inputs.password.message, I18n.t('account.common.validation.password_long'));
    });
  });

  describe('validatePasswordConfirm', () => {
    it('sets valid to true when passwords match and are valid', () => {
      const formActions = [
        actions.inputChanged('password', 'FakeyFakey1234'),
        actions.inputChanged('passwordConfirm', 'FakeyFakey1234'),
        actions.validatePasswordConfirm()
      ];
      const newState = applyAllActions({...defaultState}, formActions);

      assert.isTrue(newState.inputs.passwordConfirm.valid);
    });

    it('sets valid to false when password is short', () => {
      const formActions = [
        actions.inputChanged('password', 'FakeyFakey1234'),
        actions.inputChanged('passwordConfirm', 'short'),
        actions.validatePasswordConfirm()
      ];
      const newState = applyAllActions({...defaultState}, formActions);

      assert.isFalse(newState.inputs.passwordConfirm.valid);
      assert.equal(newState.inputs.passwordConfirm.message, I18n.t('account.common.validation.password_short'));
    });

    it('sets valid to false when password is long', () => {
      const formActions = [
        actions.inputChanged('password', 'FakeyFakey1234'),
        actions.inputChanged('passwordConfirm', 'HelloIAmAVeryLongAndInvalidPasswordWhichIsADumbIdeaForSecurity'),
        actions.validatePasswordConfirm()
      ];
      const newState = applyAllActions({...defaultState}, formActions);

      assert.isFalse(newState.inputs.passwordConfirm.valid);
      assert.equal(newState.inputs.passwordConfirm.message, I18n.t('account.common.validation.password_long'));
    });

    it('sets valid to false when passwords do not match', () => {
      const formActions = [
        actions.inputChanged('password', 'FakeyFakey1234'),
        actions.inputChanged('passwordConfirm', 'FakeyFakeyFakey'),
        actions.validatePasswordConfirm()
      ];
      const newState = applyAllActions({...defaultState}, formActions);

      assert.isFalse(newState.inputs.passwordConfirm.valid);
      assert.equal(newState.inputs.passwordConfirm.message, I18n.t('account.common.validation.mismatch'));
    });
  });

  describe('recaptchaCallback', () => {
    it('sets recapthca to valid', () => {
      const recaptchaCallbackAction = actions.recaptchaCallback('yes i am valid hello');
      let newState = reducer({...defaultState}, recaptchaCallbackAction);

      assert.isTrue(newState.inputs.recaptcha.valid);
    });

    it('sets recaptcha to not valid', () => {
      const recaptchaCallbackAction = actions.recaptchaCallback(null);
      let newState = reducer({...defaultState}, recaptchaCallbackAction);

      assert.isFalse(newState.inputs.recaptcha.valid);
    });
  });

  describe('validateForm', () => {
    it('validates all fields', () => {
      const callback = sinon.spy();
      const formActions = [
        actions.inputChanged('email', 'fakey@fake.com'),
        actions.inputChanged('screenName', 'Fakey McFakerson'),
        actions.inputChanged('password', 'FakeyFakey1234'),
        actions.inputChanged('passwordConfirm', 'FakeyFakey1234'),
        actions.recaptchaCallback('yes i am valid hello'),
        actions.validateForm(callback, false)
      ];
      const newState = applyAllActions({...defaultState}, formActions);

      _.forOwn(newState.inputs, (input) => {
        assert.isTrue(input.valid);
      });

      assert.isTrue(callback.calledOnce);
      assert.isTrue(newState.formSubmitted);
    });

    it('validates required fields', () => {
      const callback = sinon.spy();
      const skipPasswordValidation = false;
      const formActions = [
        actions.inputChanged('email', ''),
        actions.inputChanged('screenName', null),
        actions.inputChanged('password', undefined),
        actions.inputChanged('passwordConfirm', ''),
        actions.recaptchaCallback(null),
        actions.validateForm(callback, skipPasswordValidation)
      ];
      const newState = applyAllActions({...defaultState}, formActions);

      _.forOwn(newState.inputs, (input) => {
        if (input.required === true) {
          assert.isFalse(input.valid);
          assert.equal(input.message, I18n.t('core.validation.required'));
        }
      });

      // the form is still in a "submitted" state
      // however, the callback should not have been called
      assert.isTrue(callback.notCalled);
      assert.isTrue(newState.formSubmitted);
    });

    it('skips password validation if told to', () => {
      const callback = sinon.spy();
      const skipPasswordValidation = true;
      const formActions = [
        actions.inputChanged('email', 'fakey@fake.com'),
        actions.inputChanged('screenName', 'Fakey McFakerson'),
        actions.inputChanged('password', ''),
        actions.inputChanged('passwordConfirm', null),
        actions.recaptchaCallback('yes i am valid hello'),
        actions.validateForm(callback, skipPasswordValidation)
      ];
      const newState = applyAllActions({...defaultState}, formActions);

      _.forOwn(newState.inputs, (input) => {
        assert.isTrue(input.valid);
      });

      // even though the passwords are empty, the callback is called
      assert.isTrue(callback.calledOnce);
      assert.isTrue(newState.formSubmitted);
    });
  });
});
