import React, { PropTypes } from 'react';
import { FieldDescriptor } from '../lib/sharedPropTypes';
import TextInput from './MetadataFields/TextInput';
import TextArea from './MetadataFields/TextArea';
import Select from './MetadataFields/Select';
import TagsInput from 'components/MetadataFields/TagsInput';

const MetadataField = (props) => {
  let element = null;

  const isValid = props.isPristine || !props.descriptor.required
    ? true
    : props.descriptor.validator(props.value);

  const errorMsg = isValid ? [] : [props.descriptor.errorMsg];

  const newProps = Object.assign({}, props, { tags: props.descriptor.tags }, { isValid: isValid });

  const labelClassNames = ['block-label'];

  props.descriptor.required && labelClassNames.push('required'); // eslint-disable-line

  switch (props.descriptor.type) {
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
      throw new Error(`unexpected field descriptor type: ${props.descriptor.type}`);
  }

  return (
    <div className={props.descriptor.className}>
      <label
        htmlFor={props.descriptor.key}
        className={labelClassNames.join(' ')}>
        {props.descriptor.label}
      </label>
      {element}
      {errorMsg && <span className="metadata-validation-error">{errorMsg}</span>}
    </div>
  );
};

MetadataField.propTypes = {
  descriptor: FieldDescriptor,
  value: PropTypes.string,
  onChange: PropTypes.func,
  className: PropTypes.string,
  isPristine: PropTypes.bool
};

export default MetadataField;
