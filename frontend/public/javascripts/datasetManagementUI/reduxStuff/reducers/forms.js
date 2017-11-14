import dotProp from 'dot-prop-immutable';
import {
  MARK_FORM_DIRTY,
  MARK_FORM_CLEAN,
  SHOW_FORM_ERRORS,
  HIDE_FORM_ERRORS,
  SET_FORM_ERRORS,
  SET_FORM_STATE,
  APPEND_FORM_ERROR,
  CLEAR_INTERNAL_STATE,
  SET_SHOULD_FORM_SAVE
} from 'reduxStuff/actions/forms';

const initialState = {
  datasetForm: {
    isDirty: false,
    showErrors: false,
    errors: []
  },
  columnForm: {
    isDirty: false,
    showErrors: false,
    errors: []
  },
  parseOptionsForm: {
    isDirty: false,
    showErrors: false,
    state: {}
  },
  hrefForm: {
    isDirty: false,
    shouldSave: false,
    errors: []
  },
  addColForm: {
    isDirty: false,
    clearInternalState: false,
    errors: {},
    state: {}
  }
};

const forms = (state = initialState, action) => {
  switch (action.type) {
    case MARK_FORM_DIRTY:
      return dotProp.set(state, `${action.formName}.isDirty`, true);

    case MARK_FORM_CLEAN:
      return dotProp.set(state, `${action.formName}.isDirty`, false);

    case SHOW_FORM_ERRORS:
      return dotProp.set(state, `${action.formName}.showErrors`, true);

    case HIDE_FORM_ERRORS:
      return dotProp.set(state, `${action.formName}.showErrors`, false);

    case SET_FORM_ERRORS:
      return dotProp.set(state, `${action.formName}.errors`, action.errors);

    case SET_FORM_STATE:
      return dotProp.set(state, `${action.formName}.state`, action.state);

    case APPEND_FORM_ERROR:
      return dotProp.set(state, `${action.formName}.errors`, existingErrors => [
        ...existingErrors,
        action.error
      ]);

    case CLEAR_INTERNAL_STATE:
      return dotProp.set(state, `${action.formName}.clearInternalState`, action.val);

    case SET_SHOULD_FORM_SAVE:
      return dotProp.set(state, `${action.formName}.shouldSave`, action.shouldSave);

    default:
      return state;
  }
};

export default forms;
