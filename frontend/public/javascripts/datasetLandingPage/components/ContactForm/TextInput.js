import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';

class TextInput extends Component {
  constructor(props) {
    super(props);

    this.state = {
      dirty: false
    };

    _.bindAll(this, 'onBlur');
  }

  onBlur() {
    this.setState({ dirty: true });
  }

  render() {
    const { description, field, label, name, onChange } = this.props;

    const classes = classNames('text-input', name);
    const labelId = `${name}-label`;

    const descriptionElement = description ?
      <span id="description" className="x-small quiet">
        {description}
      </span> :
      null;

    const isInvalid = field.invalid && this.state.dirty;

    return (
      <div>
        <label id={labelId} htmlFor={name} className="block-label">
          {label}
          {descriptionElement}
        </label>

        <input
          id={name}
          className={classes}
          type="text"
          value={field.value}
          aria-invalid={isInvalid}
          aria-labelledby={labelId}
          aria-required
          onChange={onChange}
          onBlur={this.onBlur} />
      </div>
    );
  }
}

TextInput.propTypes = {
  description: PropTypes.string,
  field: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func
};

export default TextInput;
