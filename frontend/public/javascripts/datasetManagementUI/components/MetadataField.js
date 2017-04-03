import React, { PropTypes, Component } from 'react';
import _ from 'lodash';

import TextInput from 'components/MetadataFields/TextInput';
import TextArea from 'components/MetadataFields/TextArea';
import Select from 'components/MetadataFields/Select';
import TagsInput from 'components/MetadataFields/TagsInput';
import styles from 'styles/MetadataField.scss';

class MetadataField extends Component {
  constructor() {
    super();

    this.state = {
      errorsVisible: false
    };

    _.bindAll(this, ['showErrors']);
  }

  showErrors() {
    this.setState({
      errorsVisible: true
    });
  }

  render() {
    // TODO: remove when we upgrade babel-eslint
    // babel-eslint bug: https://github.com/babel/babel-eslint/issues/249
    /* eslint-disable no-use-before-define */
    const {
      isDirty,
      schema,
      type,
      name,
      className,
      label,
      ...other
    } = this.props;
    /* eslint-enable no-use-before-define */

    let element = null;

    let errors = [];

    const { fields: dirtyFields } = isDirty;

    const isDirtyField = dirtyFields && dirtyFields.includes(name);

    const hasValidationErrors = _.get(schema, `fields.${name}.errors`, []).length;

    const { errorsVisible } = this.state;

    if (isDirtyField && hasValidationErrors && errorsVisible) {
      errors = schema.fields[name].errors.map((msg, idx) =>
        <li className={styles.errorMessage} key={idx}>{msg}</li>);
    }

    const required = _.get(schema, `fields.${name}.required`, false);

    const newProps = {
      ...other,
      schema,
      name,
      required,
      inErrorState: !!(isDirtyField && hasValidationErrors && errorsVisible),
      showErrors: this.showErrors
    };

    const labelClassNames = [styles.label];

    if (required) {
      labelClassNames.push(styles.labelRequired);
    }

    switch (type) {
      case 'text':
        element = <TextInput {...newProps} />;
        break;
      case 'textarea':
        element = <TextArea {...newProps} />;
        break;
      case 'select':
        element = <Select {...newProps} />;
        break;
      case 'tagsinput':
        element = <TagsInput {...newProps} />;
        break;
      default:
        throw new Error(`unexpected field descriptor type: ${type}`);
    }

    return (
      <div className={className}>
        <label
          htmlFor={name}
          className={labelClassNames.join(' ')}>
          {label}
        </label>
        {element}
        {errors.length ? <ul className={styles.errorList}>{errors}</ul> : null}
      </div>
    );
  }
}

MetadataField.propTypes = {
  isDirty: PropTypes.shape({
    form: PropTypes.bool,
    fields: PropTypes.arrayOf(PropTypes.string)
  }),
  schema: PropTypes.shape({
    fields: PropTypes.object,
    isValid: PropTypes.bool
  }),
  name: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  className: PropTypes.string,
  label: PropTypes.string,
  other: PropTypes.object
};

export default MetadataField;
