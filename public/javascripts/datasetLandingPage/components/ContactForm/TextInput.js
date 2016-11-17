import React, { PropTypes } from 'react';
import classNames from 'classnames';

const TextInput = React.createClass({
  propTypes: {
    description: PropTypes.string,
    field: PropTypes.object.isRequired,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func
  },

  getInitialState() {
    return {
      dirty: false
    };
  },

  onBlur() {
    this.setState({ dirty: true });
  },

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
});

export default TextInput;
