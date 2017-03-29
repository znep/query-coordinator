import React, { PropTypes } from 'react';
import _ from 'lodash';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { getComponentName } from 'lib/util';

const getValidationErrors = (schema, model) => Object.keys(schema).reduce((acc, key) => {
  // Gets the model from the reformed HOC runs it again a user-defined validation scheam
  // Schema is passed in at the point of form-creation.

  // Current built-in rules are: required, type, minLength, and maxLength. Test is a
  // wildcard that accepts a function that returns either a falsey value or an error message.
  // Feel free to add any commonly used validations in this component.
  const errors = [];
  const value = model[key];
  const rules = schema[key];

  if (!value && !rules.required) {
    return acc;
  }

  if (rules.required && !value) {
    errors.push(I18n.edit_metadata.validation_error_required.format(key));
  }

  if (rules.type && typeof value !== rules.type) {
    const expectedType = rules.type;
    const receivedType = typeof value;
    errors.push(I18n.edit_metadata.validation_error_type.format(key, expectedType, receivedType));
  }

  if (rules.minLength) {
    if (!value || value.length < rules.minLength) {
      const minLength = rules.minLength;
      errors.push(I18n.edit_metadata.validation_error_minlength.format(key, minLength));
    }
  }

  if (rules.maxLength) {
    if (value && value.length > rules.maxLength) {
      const maxLength = rules.maxLength;
      errors.push(I18n.edit_metadata.validation_error_maxlength.format(key, maxLength));
    }
  }

  if (rules.test) {
    const error = rules.test(value);

    if (error) {
      errors.push(error);
    }
  }

  return _.assign({}, acc, {
    isValid: !errors.length && acc.isValid,
    fields: _.assign({}, acc.fields, {
      [key]: {
        isValid: !errors.length,
        required: !!rules.required,
        errors
      }
    })
  });
}, { isValid: true, fields: {} });

const validateSchema = schema => (WrappedComponent) => {
  const validated = props => {
    const validationErrors = getValidationErrors(schema, props.model);

    return React.createElement(WrappedComponent, _.assign({}, props, {
      schema: validationErrors
    }));
  };

  validated.displayName = `ValidateSchema(${getComponentName(WrappedComponent)})`;

  validated.propTypes = {
    model: PropTypes.object.isRequired
  };

  return hoistNonReactStatics(validated, WrappedComponent);
};

export default validateSchema;
