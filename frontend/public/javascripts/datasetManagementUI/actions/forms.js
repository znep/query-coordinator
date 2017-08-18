export const MARK_FORM_DIRTY = 'MARK_FORM_DIRTY';
export const markFormDirty = formName => ({
  type: MARK_FORM_DIRTY,
  formName
});

export const MARK_FORM_CLEAN = 'MARK_FORM_CLEAN';
export const markFormClean = formName => ({
  type: MARK_FORM_CLEAN,
  formName
});

export const SHOW_FORM_ERRORS = 'SHOW_FORM_ERRORS';
export const showFormErrors = formName => ({
  type: SHOW_FORM_ERRORS,
  formName
});

export const HIDE_FORM_ERRORS = 'HIDE_FORM_ERRORS';
export const hideFormErrors = formName => ({
  type: HIDE_FORM_ERRORS,
  formName
});

export const SET_FORM_ERRORS = 'SET_FORM_ERRORS';
export const setFormErrors = (formName, errors) => ({
  type: SET_FORM_ERRORS,
  formName,
  errors
});