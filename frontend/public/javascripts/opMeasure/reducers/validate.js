import _ from 'lodash';

import * as actions from '../actions/validate';

// The subset of state tracked by this reducer is an object that contains the
// active validation errors.
const INITIAL_STATE = Object.freeze({
  validationErrors: {
    measureName: false,
    measureShortName: false
  }
});

const validateMeasureName = (state) => {
  const { measure, validationErrors } = state;
  const { name } = measure;
  const normalizedName = name.trim().replace(/\s+/g, ' ');
  const isValid = normalizedName.length > 0 && normalizedName.length < 255;

  return {
    ...state,
    measure: {
      ...measure,
      name: normalizedName
    },
    validationErrors: {
      ...validationErrors,
      measureName: !isValid
    }
  };
};

const validateMeasureShortName = (state) => {
  const { measure, validationErrors } = state;
  const { shortName } = measure;
  const normalizedShortName = shortName.trim().replace(/\s+/g, ' ');
  const isValid = normalizedShortName.length <= 26;

  return {
    ...state,
    measure: {
      ...measure,
      shortName: normalizedShortName
    },
    validationErrors: {
      ...validationErrors,
      measureShortName: !isValid
    }
  };
};

const validateMeasureDescription = (state) => {
  const { measure } = state;
  const { description } = measure;
  const normalizedDescription = description.trim();

  return {
    ...state,
    measure: {
      ...measure,
      description: normalizedDescription
    }
  };
};

export const validators = {
  validateMeasureDescription,
  validateMeasureName,
  validateMeasureShortName
};

// Subreducer for editor validations and normalizations.
export default (state = INITIAL_STATE, action) => {
  if (_.isUndefined(action)) {
    return state;
  }

  switch (action.type) {
    case actions.VALIDATE_ALL:
      return _.flow(_.values(validators))(state);

    case actions.VALIDATE_MEASURE_NAME:
      return validateMeasureName(state);

    case actions.VALIDATE_MEASURE_SHORT_NAME:
      return validateMeasureShortName(state);

    case actions.VALIDATE_MEASURE_DESCRIPTION:
      return validateMeasureDescription(state);

    default:
      console.debug(`Encountered unknown validation action: ${action.type}`);
      return state;
  }
};
