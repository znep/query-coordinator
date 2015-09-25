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
      onSubmit: PropTypes.func,
      value: PropTypes.string.isRequired
    },
    getDefaultProps: function() {
      return { disabled: false };
    },
    getInitialState: function() {
      return { isLoading: false };
    },
    handleSubmit: function(event) {
      const { action, authenticityToken, disabled, method, onSubmit } = this.props;
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
        complete: function() {
          stopLoading();
        },
        success: function(response) {
          onSubmit(response);
        }
      });
    },
    render: function() {
      const { action, authenticityToken, method, value, ...buttonProps } = this.props;
      const { isLoading } = this.state;
      return (
        <form
          acceptCharset="UTF-8"
          action={action}
          method="post"
          onSubmit={this.handleSubmit}
          style={{ display: 'inline' }}>
          <div style={{ margin: 0, padding: 0, display: 'inline' }}>
            <input name="utf8" type="hidden" value="✓" />
            <input name="_method" type="hidden" value={method} />
            <input name="authenticity_token" type="hidden" value={authenticityToken} />
          </div>
          <LoadingButton
            isLoading={isLoading}
            type="submit"
            {...buttonProps}>{value}</LoadingButton>
        </form>
      );
    }
  });

})();
