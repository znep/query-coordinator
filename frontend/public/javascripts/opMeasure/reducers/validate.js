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

const validateCoreViewName = (state) => {
  const { coreView, validationErrors } = state;
  const { name } = coreView;
  const normalizedName = name.trim().replace(/\s+/g, ' ');
  const isValid = normalizedName.length > 0 && normalizedName.length < 255;

  return {
    ...state,
    coreView: {
      ...coreView,
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
  const metadata = measure.metadata || {};
  const shortName = metadata.shortName || '';
  const normalizedShortName = shortName.trim().replace(/\s+/g, ' ');
  const isValid = normalizedShortName.length <= 26;

  return {
    ...state,
    measure: {
      ...measure,
      metadata: {
        ...metadata,
        shortName: normalizedShortName
      }
    },
    validationErrors: {
      ...validationErrors,
      measureShortName: !isValid
    }
  };
};

const validateCoreViewDescription = (state) => {
  const { coreView } = state;
  const description = coreView.description || '';
  const normalizedDescription = description.trim();

  return {
    ...state,
    coreView: {
      ...coreView,
      description: normalizedDescription
    }
  };
};

export const validators = {
  validateCoreViewDescription,
  validateCoreViewName,
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
      return validateCoreViewName(state);

    case actions.VALIDATE_MEASURE_SHORT_NAME:
      return validateMeasureShortName(state);

    case actions.VALIDATE_MEASURE_DESCRIPTION:
      return validateCoreViewDescription(state);

    default:
      console.debug(`Encountered unknown validation action: ${action.type}`);
      return state;
  }
};
