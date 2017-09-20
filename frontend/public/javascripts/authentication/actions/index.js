export const INPUT_CHANGED = 'INPUT_CHANGED';
export const VALIDATE_FORM = 'VALIDATE_FORM';
export const VALIDATE_EMAIL = 'VALIDATE_EMAIL';
export const VALIDATE_SCREENNAME = 'VALIDATE_SCREENNAME';
export const VALIDATE_PASSWORD = 'VALIDATE_PASSWORD';
export const VALIDATE_PASSWORD_CONFIRM = 'VALIDATE_PASSWORD_CONFIRM';
export const RECAPTCHA_CALLBACK = 'RECAPTCHA_CALLBACK';

export const inputChanged = (name, value) => ({
  type: INPUT_CHANGED,
  name,
  value
});

export const validateForm = (callback, skipPasswordValidation) => ({
  type: VALIDATE_FORM,
  callback,
  skipPasswordValidation
});

export const recaptchaCallback = (response) => ({
  type: RECAPTCHA_CALLBACK,
  response
});

export const validateEmail = () => ({ type: VALIDATE_EMAIL });
export const validateScreenName = () => ({ type: VALIDATE_SCREENNAME });
export const validatePassword = () => ({ type: VALIDATE_PASSWORD });
export const validatePasswordConfirm = () => ({ type: VALIDATE_PASSWORD_CONFIRM });
