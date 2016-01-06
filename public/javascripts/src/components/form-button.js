import LoadingButton from './loading-button';
import React, { PropTypes } from 'react';

const FormButton = React.createClass({
  propTypes: {
    action: PropTypes.string.isRequired,
    authenticityToken: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
    method: PropTypes.string.isRequired,
    onSuccess: PropTypes.func,
    value: PropTypes.string.isRequired
  },
  getDefaultProps() {
    return {
      disabled: false,
      onSuccess: _.noop
    };
  },
  getInitialState() {
    return {
      isLoading: false
    };
  },
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
  },
  render() {
    const { value, ...buttonProps } = this.props;
    const { isLoading } = this.state;
    return (
      <form
        acceptCharset="UTF-8"
        onSubmit={this.handleSubmit}
        style={{ display: 'inline' }}
        >
        <LoadingButton
          isLoading={isLoading}
          type="submit"
          {...buttonProps}
          >
          {value}
        </LoadingButton>
      </form>
    );
  }
});

export default FormButton;
