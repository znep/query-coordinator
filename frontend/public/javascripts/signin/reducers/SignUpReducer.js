import _ from 'lodash';
import I18n from 'common/i18n';
import * as actions from '../actions';
import { isValidEmail } from '../Util';

const passwordMinLength = 8;
const passwordMaxLength = 40;

const inputChanged = (state, action) => {
  const { name, value } = action;
  const input = state.inputs[name];

  // if the value is different, set it to valid
  // (all fields are re-validated on form submit)
  if (input.value !== value) {
    input.valid = true;
    input.message = '';
  }

  input.value = value;

  return { ...state };
};

const validateEmail = state => {
  const { inputs } = state;
  const { value } = inputs.email;

  const email = {
    ...inputs.email,
    valid: true,
    message: ''
  };

  const strictValidation = true;

  if (!_.isEmpty(value) && !isValidEmail(value, strictValidation)) {
    email.valid = false;
    email.message = I18n.t('core.validation.email');
  }

  return { ...state, inputs: { ...inputs, email } };
};

const validateScreenName = state => {
  const { inputs } = state;

  const screenName = {
    ...inputs.screenName,
    valid: true,
    message: ''
  };

  return { ...state, inputs: { ...inputs, screenName } };
};

const validatePassword = state => {
  const { inputs } = state;
  const { value } = inputs.password;

  const password = {
    ...inputs.password,
    valid: true,
    message: ''
  };

  if (!_.isEmpty(value)) {
    if (value.length < passwordMinLength) {
      password.valid = false;
      password.message = I18n.t('account.common.validation.password_short');
    } else if (value.length > passwordMaxLength) {
      password.valid = false;
      password.message = I18n.t('account.common.validation.password_long');
    }
  }

  return { ...state, inputs: { ...inputs, password } };
};

const validatePasswordConfirm = state => {
  const { inputs } = state;
  const { value } = inputs.passwordConfirm;
  const passwordValue = inputs.password.value;

  const passwordConfirm = {
    ...inputs.passwordConfirm,
    valid: true,
    message: ''
  };

  if (!_.isEmpty(value)) {
    if (value.length < passwordMinLength) {
      passwordConfirm.valid = false;
      passwordConfirm.message = I18n.t('account.common.validation.password_short');
    } else if (value.length > passwordMaxLength) {
      passwordConfirm.valid = false;
      passwordConfirm.message = I18n.t('account.common.validation.password_long');
    } else if (value !== passwordValue) {
      passwordConfirm.valid = false;
      passwordConfirm.message = I18n.t('account.common.validation.mismatch');
    }
  }

  return { ...state, inputs: { ...inputs, passwordConfirm } };
};

const validateRequiredInputs = (state, action) => {
  const { inputs } = state;

  _.forOwn(inputs, (input, inputName) => {
    // if the user is linking a social account to a new Socrata account,
    // they they will not have a password so we skip password validation
    const skipPassword =
      action.skipPasswordValidation === true &&
      (inputName === 'password' || inputName === 'passwordConfirm');

    if (!skipPassword && input.required && _.isEmpty(input.value)) {
      input.valid = false;
      input.message = I18n.t('core.validation.required');
    }
  });

  return { ...state, inputs };
};

const recaptchaCallback = (state, action) => {
  const recaptcha = {
    valid: !_.isEmpty(action.response)
  };

  return { ...state, inputs: { ...state.inputs, recaptcha } };
};

const validateForm = (state, action) => {
  const validations = [
    validateEmail,
    validateScreenName,
    validatePassword,
    validatePasswordConfirm,
    validateRequiredInputs
  ];

  // force each validation to run and modify the state
  const validated = _.reduce(
    validations,
    (reducedState, validation) => validation(reducedState, action),
    { ...state }
  );

  const { inputs } = validated;

  let isFormValid = true;

  // invalidate form if any inputs are invalid
  _.forOwn(inputs, (input) => {
    if (!input.valid) {
      isFormValid = false;
    }
  });

  if (isFormValid && action.callback) {
    action.callback();
  }

  validated.formSubmitted = true;

  return validated;
};

export default (state, action) => {
  switch (action.type) {
    case actions.INPUT_CHANGED:
      return inputChanged(state, action);
    case actions.VALIDATE_FORM:
      return validateForm(state, action);
    case actions.VALIDATE_EMAIL:
      return validateEmail(state, action);
    case actions.VALIDATE_SCREENNAME:
      return validateScreenName(state, action);
    case actions.VALIDATE_PASSWORD:
      return validatePassword(state, action);
    case actions.VALIDATE_PASSWORD_CONFIRM:
      return validatePasswordConfirm(state, action);
    case actions.RECAPTCHA_CALLBACK:
      return recaptchaCallback(state, action);
    default:
      return state;
  }
};
