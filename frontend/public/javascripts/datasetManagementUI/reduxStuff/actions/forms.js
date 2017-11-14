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

export const APPEND_FORM_ERROR = 'APPEND_FORM_ERROR';
export const appendFormError = (formName, error) => ({
  type: APPEND_FORM_ERROR,
  formName,
  error
});

export const SET_FORM_STATE = 'SET_FORM_STATE';
export const setFormState = (formName, state) => ({
  type: SET_FORM_STATE,
  formName,
  state
});

export const CLEAR_INTERNAL_STATE = 'CLEAR_INTERNAL_STATE';
export const clearInternalState = (formName, val) => ({
  type: CLEAR_INTERNAL_STATE,
  formName,
  val
});

export const SET_SHOULD_FORM_SAVE = 'SET_SHOULD_FORM_SAVE';
export const setShouldFormSave = (formName, bool) => ({
  type: SET_SHOULD_FORM_SAVE,
  formName,
  shouldSave: bool
});

export const SET_SHOULD_EXIT = 'SET_SHOULD_EXITE';
export const setShouldExit = (formName, bool) => ({
  type: SET_SHOULD_EXIT,
  formName,
  shouldExit: bool
});
