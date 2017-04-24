import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { getComponentName } from 'lib/util';

export const getValidationErrors = (validationRules, model) => {
  return (
    Object.keys(validationRules).reduce((acc, key) => {
      // Gets the model from the manageModel HOC, runs it against a user-defined validation rules.
      // Rules are passed in at the point of form-creation.

      // Current built-in rules are: required, type, minLength, and maxLength. Test is a
      // wildcard that accepts a function that returns either a falsey value or an error message.
      // Feel free to add any commonly used validations in this component.
      const errors = [];
      const value = model[key];
      const rules = validationRules[key];

      if (!value && !rules.required) {
        return acc;
      }

      if (rules.required && !value) {
        errors.push(I18n.edit_metadata.validation_error_required);
      }

      if (rules.type && typeof value !== rules.type) {
        const expectedType = rules.type;
        const receivedType = typeof value;
        errors.push(
          I18n.edit_metadata.validation_error_type.format(_.upperFirst(key), expectedType, receivedType)
        );
      }

      if (rules.minLength) {
        if (!value || value.length < rules.minLength) {
          const minLength = rules.minLength;
          errors.push(
            I18n.edit_metadata.validation_error_minlength.format(_.upperFirst(key), minLength)
          );
        }
      }

      if (rules.maxLength) {
        if (value && value.length > rules.maxLength) {
          const maxLength = rules.maxLength;
          errors.push(I18n.edit_metadata.validation_error_maxlength.format(_.upperFirst(key), maxLength));
        }
      }

      if (rules.noDupes) {
        const subfield = model[rules.noDupes];

        if (value && Array.isArray(subfield)) {
          if (subfield.includes(value)) {
            errors.push(I18n.edit_metadata.validation_error_no_dupes);
          }
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
    }, { isValid: true, fields: {} })
  );
};

const validateSchema = (validationRules = {}) => (WrappedComponent) => {
  class Validated extends Component {
    constructor() {
      super();
      this.state = {
        schema: {
          isValid: true,
          fields: {}
        }
      };
    }

    // Called once right before initial render. We calculate an initial schema here.
    componentWillMount() {
      const { model, validationRules: validationRulesFromProps } = this.props;

      // If rules were not passed directly into the validateSchema fn, then use
      // rules passed in as prop (which you might do if you need to, say, generate
      // validation rules with info from the redux store)
      const rules = _.isEmpty(validationRules) ? validationRulesFromProps : validationRules;

      this.setState({
        schema: getValidationErrors(rules, model)
      });
    }

    // Called on every prop change (in this case, the form's data-model changing from
    // user input). Calculate a new schema
    componentWillReceiveProps(nextProps) {
      const { model: newModel, validationRules: validationRulesFromProps } = nextProps;
      const { model: oldModel } = this.props;

      if (!_.isEqual(oldModel, newModel)) {
        const rules = _.isEmpty(validationRules) ? validationRulesFromProps : validationRules;

        const schema = getValidationErrors(rules, newModel);

        this.setState({
          schema
        });
      }
    }

    render() {
      return React.createElement(WrappedComponent, _.assign({}, this.props, {
        schema: this.state.schema
      }));
    }
  }

  Validated.displayName = `ValidateSchema(${getComponentName(WrappedComponent)})`;

  Validated.propTypes = {
    model: PropTypes.object.isRequired,
    validationRules: PropTypes.object
  };

  return hoistNonReactStatics(Validated, WrappedComponent);
};

export default validateSchema;
