import { PropTypes } from 'react';

export const FieldDescriptor = PropTypes.shape({
  type: PropTypes.oneOf(['text', 'textarea', 'select']).isRequired,
  label: PropTypes.string.isRequired,
  key: PropTypes.string.isRequired,
  required: PropTypes.bool.isRequired,
  validator: PropTypes.func,
  errorMsg: PropTypes.string,
  placeholder: PropTypes.string,
  defaultValue: PropTypes.string.isRequired,
  options: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired
  }))
});
