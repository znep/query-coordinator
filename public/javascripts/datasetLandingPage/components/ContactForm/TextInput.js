import React, { PropTypes } from 'react';
import classNames from 'classnames';

var TextInput = React.createClass({
  propTypes: {
    description: PropTypes.string,
    field: PropTypes.object.isRequired,
    label: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func
  },

  getInitialState: function() {
    return {
      dirty: false
    };
  },

  onBlur: function() {
    this.setState({ dirty: true });
  },

  render: function() {
    var { description, field, label, name, onChange } = this.props;

    var classes = classNames('text-input', name);
    var labelId = `${name}-label`;

    var descriptionElement = description ?
      <span id="description" className="x-small quiet">
        {description}
      </span> :
      null;

    var isInvalid = field.invalid && this.state.dirty;

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
