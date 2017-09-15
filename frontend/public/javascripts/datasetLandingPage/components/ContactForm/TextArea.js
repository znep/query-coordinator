import _ from 'lodash';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import classNames from 'classnames';

class TextArea extends Component {
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
    const { field, label, name, onChange } = this.props;

    const classes = classNames('text-input text-area', name);
    const labelId = `${name}-label`;
    const isInvalid = field.invalid && this.state.dirty;

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
}

TextArea.propTypes = {
  field: PropTypes.object.isRequired,
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  onChange: PropTypes.func
};

export default TextArea;
