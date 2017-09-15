import LoadingButton from './loading-button';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

class FormButton extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: false
    };

    _.bindAll(this, 'handleSubmit');
  }
  handleSubmit(event) {
    const {
      action,
      authenticityToken,
      disabled,
      method,
      onSuccess
    } = this.props;

    const stopLoading = () => { this.setState({ isLoading: false }); };

    event.preventDefault();
    if (disabled) { return; }

    this.setState({ isLoading: true });

    $.ajax({
      context: this,
      url: action,
      type: method,
      body: JSON.stringify({ authenticityToken }),
      dataType: 'json',
      complete: stopLoading,
      success: onSuccess
    });
  }
  render() {
    const { value, ...buttonProps } = this.props;
    const { isLoading } = this.state;
    return (
      <form
        acceptCharset="UTF-8"
        onSubmit={this.handleSubmit}
        style={{ display: 'inline' }}>
        <LoadingButton isLoading={isLoading} type="submit" {...buttonProps}>
          {value}
        </LoadingButton>
      </form>
    );
  }
}

FormButton.propTypes = {
  action: PropTypes.string.isRequired,
  authenticityToken: PropTypes.string.isRequired,
  disabled: PropTypes.bool,
  method: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  value: PropTypes.string.isRequired
};

FormButton.defaultProps = {
  disabled: false,
  onSuccess: _.noop
};

export default FormButton;
