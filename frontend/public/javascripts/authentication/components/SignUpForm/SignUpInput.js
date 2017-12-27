import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import cssModules from 'react-css-modules';
import _ from 'lodash';
import { inputChanged } from '../../actions';
import styles from './sign-up-form.module.scss';

class SignUpInput extends React.Component {
  constructor(props) {
    super(props);

    this.renderMessage = this.renderMessage.bind(this);
  }

  componentDidMount() {
    if (this.props.focusOnMount === true) {
      this.domNode.focus();
    }
  }

  renderMessage() {
    const { valid, message } = this.props;

    if (_.isEmpty(message) || valid === true) {
      return null;
    }

    return <div styleName="error-message">{message}</div>;
  }

  render() {
    const {
      children,
      inputType,
      label,
      name,
      inputName,
      valid,
      required,
      onChange,
      onBlur,
      value } = this.props;

    return (
      <div>
        <div styleName="label-container">
          <label styleName="label" htmlFor={name}>
            {label} {required ? <span styleName="required">*</span> : null}
            {children}
          </label>
          {this.renderMessage()}
        </div>
        <input
          ref={(domNode) => { this.domNode = domNode; }}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          styleName={valid ? 'input' : 'input-error'}
          type={inputType}
          name={inputName}
          id={name}
          aria-required={required} />
      </div>
    );
  }
}

SignUpInput.propTypes = {
  children: PropTypes.element,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func,
  value: PropTypes.string,
  label: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  inputName: PropTypes.string.isRequired,
  inputType: PropTypes.string,
  required: PropTypes.bool,
  focusOnMount: PropTypes.bool,
  valid: PropTypes.bool.isRequired,
  message: PropTypes.string
};

SignUpInput.defaultProps = {
  inputType: 'text',
  focusOnMount: false,
  required: true,
  valid: true
};

const mapStateToProps = (state, ownProps) => {
  const thisInput = state.inputs[ownProps.name];
  return {
    value: thisInput.value,
    valid: thisInput.valid,
    message: thisInput.message
  };
};

const mapDispatchToProps = (dispatch, ownProps) => ({
  onChange: (value) => dispatch(inputChanged(ownProps.name, value))
});

export default connect(mapStateToProps, mapDispatchToProps)(cssModules(SignUpInput, styles));
