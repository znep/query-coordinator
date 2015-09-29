(() => {

  const PropTypes = React.PropTypes;
  let componentsNS = blist.namespace.fetch('blist.components');
  const { LoadingButton } = componentsNS;

  componentsNS.FormButton = React.createClass({
    displayName: 'FormButton',
    propTypes: {
      action: PropTypes.string.isRequired,
      authenticityToken: PropTypes.string.isRequired,
      disabled: PropTypes.bool,
      method: PropTypes.string.isRequired,
      onSuccess: PropTypes.func,
      value: PropTypes.string.isRequired
    },
    getDefaultProps: function() {
      return {
        disabled: false,
        onSuccess: _.noop
      };
    },
    getInitialState: function() {
      return {
        isLoading: false
      };
    },
    handleSubmit: function(event) {
      const {
        action,
        authenticityToken,
        disabled,
        method,
        onSuccess
      } = this.props;

      const stopLoading = () => { this.setState({ isLoading: false }) };

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
    render: function() {
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

})();
