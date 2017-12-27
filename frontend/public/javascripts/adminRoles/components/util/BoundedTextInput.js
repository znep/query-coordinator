import PropTypes from 'prop-types';
import React, { Component } from 'react';
import cx from 'classnames';
import cssModules from 'react-css-modules';
import styles from './bounded-text-input.module.scss';
import bindAll from 'lodash/fp/bindAll';
import cond from 'lodash/fp/cond';
import constant from 'lodash/fp/constant';
import noop from 'lodash/fp/noop';
import omit from 'lodash/fp/omit';

class BoundedTextInput extends Component {
  constructor() {
    super();
    bindAll(['onChange', 'updateCharacterCount'], this);
    this.state = {
      characterCount: 0,
      characterCountLevel: null
    };
  }

  componentDidMount() {
    this.updateCharacterCount();
  }

  updateCharacterCount() {
    const { maxCharacterCount } = this.props;
    const characterCount = this.inputRef.value.length;
    const characterCountLevel = cond([
      [() => characterCount > maxCharacterCount, constant('error')],
      [() => characterCount > maxCharacterCount - 10, constant('warning')],
      [() => true, constant(null)]
    ])();
    this.setState({ characterCount, characterCountLevel });
  }

  onChange(ev) {
    this.updateCharacterCount();
    this.props.onChange(ev);
  }

  render() {
    const { maxCharacterCount, className, inputRef, ...inputProps } = omit(
      ['onChange', 'styles'],
      this.props
    );
    const { characterCount, characterCountLevel } = this.state;
    const classes = cx(
      {
        [`text-input-${characterCountLevel}`]: characterCountLevel
      },
      'text-input',
      className
    );
    return (
      <div styleName="bounded-text-input">
        <input
          className={classes}
          onChange={this.onChange}
          ref={ref => {
            this.inputRef = ref;
            inputRef(ref);
          }}
          type="text"
          {...inputProps}
        />
        <small styleName="character-count">
          {characterCount}/{maxCharacterCount}
        </small>
      </div>
    );
  }
}

BoundedTextInput.propTypes = {
  maxCharacterCount: PropTypes.number.isRequired,
  inputRef: PropTypes.func
};

BoundedTextInput.defaultProps = {
  inputRef: noop,
  onChange: noop,
  value: ''
};

export default cssModules(BoundedTextInput, styles);
