import React, { PropTypes } from 'react';
import classNames from 'classnames';

var TextArea = React.createClass({
  propTypes: {
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
    var { field, label, name, onChange } = this.props;

    var classes = classNames('text-input text-area', name);
    var labelId = `${name}-label`;
    var isInvalid = field.invalid && this.state.dirty;

    return (
      <div>
        <label id={labelId} htmlFor={name} className="block-label">
          {label}
        </label>

        <textarea
          id={name}
          className={classes}
          value={field.value}
          aria-invalid={isInvalid}
          aria-labelledby={labelId}
          aria-required
          onChange={onChange}
          onBlur={this.onBlur}>
        </textarea>
      </div>
    );
  }
});

export default TextArea;
