import React, { PropTypes, Component } from 'react';
import _ from 'lodash';
import hoistNonReactStatics from 'hoist-non-react-statics';
import { getComponentName } from 'lib/util';

const getValidationErrors = (validationRules, model) => Object.keys(validationRules).reduce((acc, key) => {
  // Gets the model from the reformed HOC, runs it against a user-defined validation rules.
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

    // put schema in store on initial render so other components can know if the
    // form is valid or not before the user even types anything
    componentDidMount() {
      const { fourfour, syncToStore } = this.props;
      const { schema } = this.state;

      if (syncToStore && fourfour) {
        syncToStore(fourfour, 'schema', schema);
      }
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

    // Gets syncToStore as a prop from reformed HOC. Not required, but if available,
    // will put schema in store.
    componentWillUpdate(nextProps, nextState) {
      const { syncToStore, fourfour } = this.props;

      if (syncToStore && fourfour && !_.isEqual(this.state.schema, nextState.schema)) {
        syncToStore(fourfour, 'schema', nextState.schema);
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
    syncToStore: PropTypes.func,
    fourfour: PropTypes.string,
    validationRules: PropTypes.object
  };

  return hoistNonReactStatics(Validated, WrappedComponent);
};

export default validateSchema;
