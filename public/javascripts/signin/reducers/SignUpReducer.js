import * as actions from '../actions';
import { isValidEmail } from '../Util';

const passwordMinLength = 8;
const passwordMaxLength = 40;

export default (translate) => {
  function inputChanged(state, action) {
    const { name, value } = action;
    const input = state.inputs[name];

    input.value = value;

    return { ...state };
  }

  function validateEmail(state) {
    const { inputs } = state;
    const { value } = inputs.email;

    const email = {
      valid: true,
      message: '',
      value
    };

    const strictValidation = true;

    if (_.isEmpty(value)) {
      email.valid = false;
      email.message = translate('core.validation.required');
    } else if (!isValidEmail(value, strictValidation)) {
      email.valid = false;
      email.message = translate('core.validation.email');
    }

    return { ...state, inputs: { ...inputs, email } };
  }

  function validateScreenName(state) {
    const { inputs } = state;
    const { value } = inputs.screenName;

    const screenName = {
      valid: true,
      message: '',
      value
    };

    if (_.isEmpty(value)) {
      screenName.valid = false;
      screenName.message = translate('core.validation.required');
    }

    return { ...state, inputs: { ...inputs, screenName } };
  }

  function validatePassword(state) {
    const { inputs } = state;
    const { value } = inputs.password;

    const password = {
      valid: true,
      message: '',
      value
    };

    if (_.isEmpty(value)) {
      password.valid = false;
      password.message = translate('core.validation.required');
    } else if (value.length < passwordMinLength) {
      password.valid = false;
      password.message = translate('account.common.validation.password_short');
    } else if (value.length > passwordMaxLength) {
      password.valid = false;
      password.message = translate('account.common.validation.password_long');
    }

    return { ...state, inputs: { ...inputs, password } };
  }

  function validatePasswordConfirm(state) {
    const { inputs } = state;
    const { value } = inputs.passwordConfirm;
    const passwordValue = inputs.password.value;

    const passwordConfirm = {
      valid: true,
      message: '',
      value
    };

    if (_.isEmpty(value)) {
      passwordConfirm.valid = false;
      passwordConfirm.message = translate('core.validation.required');
    } else if (value.length < passwordMinLength) {
      passwordConfirm.valid = false;
      passwordConfirm.message = translate('account.common.validation.password_short');
    } else if (value.length > passwordMaxLength) {
      passwordConfirm.valid = false;
      passwordConfirm.message = translate('account.common.validation.password_long');
    } else if (value !== passwordValue) {
      passwordConfirm.valid = false;
      passwordConfirm.message = translate('account.common.validation.mismatch');
    }

    return { ...state, inputs: { ...inputs, passwordConfirm } };
  }

  function recaptchaCallback(state, action) {
    const recaptcha = {
      valid: !_.isEmpty(action.response)
    };

    return { ...state, inputs: { ...state.inputs, recaptcha } };
  }

  function validateForm(state, action) {
    const validations = [
      validateEmail,
      validateScreenName,
      validatePassword,
      validatePasswordConfirm
    ];

    const validated = _.reduce(
      validations,
      (reducedState, validation) => { return validation(reducedState); },
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
  }

  return (state, action) => {
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
};
