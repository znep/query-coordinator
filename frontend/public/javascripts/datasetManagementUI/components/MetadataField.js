import React, { PropTypes } from 'react';
import { FieldDescriptor } from '../lib/sharedPropTypes';
import TextInput from './MetadataFields/TextInput';
import TextArea from './MetadataFields/TextArea';
import Select from './MetadataFields/Select';

export default function MetadataField(props) {
  const { descriptor } = props;

  switch (descriptor.type) {
    case 'text':
      return <TextInput {...props} />;
    case 'textarea':
      return <TextArea {...props} />;
    case 'select':
      return <Select {...props} />;
    default:
      throw new Error(`unexpected field descriptor type: ${descriptor.type}`);
  }
}

MetadataField.propTypes = {
  descriptor: FieldDescriptor,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.string.isRequired
};
